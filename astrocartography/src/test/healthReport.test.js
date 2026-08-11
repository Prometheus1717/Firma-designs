import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  handleHealthReport,
  isAuthorized,
  notifyTelegram,
  reportDateBerlin,
  splitTelegramText,
} from '../../api/health-report.js';

function telegramResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  };
}

function responseMock() {
  const response = {
    body: undefined,
    statusCode: undefined,
    setHeader: vi.fn(),
    status: vi.fn((statusCode) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((body) => {
      response.body = body;
      return response;
    }),
  };
  return response;
}

describe('health report reliability helpers', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('fail-closed authorization', () => {
    it('rejects requests when no monitor secret is configured', () => {
      expect(isAuthorized('Bearer anything', {})).toBe(false);
    });

    it('rejects an incorrect bearer token', () => {
      expect(isAuthorized('Bearer wrong', {
        CRON_SECRET: 'vercel-secret',
        MONITOR_FALLBACK_SECRET: 'fallback-secret',
      })).toBe(false);
    });

    it('accepts the independent fallback secret', () => {
      expect(isAuthorized('Bearer fallback-secret', {
        CRON_SECRET: 'vercel-secret',
        MONITOR_FALLBACK_SECRET: 'fallback-secret',
      })).toBe(true);
    });
  });

  it('derives the Berlin report date correctly in winter and summer time', () => {
    expect(reportDateBerlin(new Date('2026-01-15T23:30:00.000Z'))).toBe('2026-01-16');
    expect(reportDateBerlin(new Date('2026-07-15T22:30:00.000Z'))).toBe('2026-07-16');
    expect(reportDateBerlin(new Date('2026-10-25T22:30:00.000Z'))).toBe('2026-10-25');
    expect(reportDateBerlin(new Date('2026-10-25T23:30:00.000Z'))).toBe('2026-10-26');
  });

  it('splits Telegram text into chunks no longer than 3900 characters', () => {
    const text = Array.from({ length: 240 }, (_, index) => (
      `${String(index).padStart(3, '0')}: ${'x'.repeat(32)}`
    )).join('\n');

    const chunks = splitTelegramText(text);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(chunk => chunk.length <= 3_900)).toBe(true);
    expect(chunks.join('\n')).toBe(text);

    const oversizedLine = 'y'.repeat(8_001);
    const lineChunks = splitTelegramText(oversizedLine);
    expect(lineChunks.every(chunk => chunk.length <= 3_900)).toBe(true);
    expect(lineChunks.join('')).toBe(oversizedLine);
  });

  it('aborts an abort-aware fetch and reports a deterministic timeout', async () => {
    vi.useFakeTimers();
    let observedSignal;
    const fetchImpl = vi.fn((_url, init) => {
      observedSignal = init.signal;
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const error = new Error('request aborted');
          error.name = 'AbortError';
          reject(error);
        }, { once: true });
      });
    });

    const request = fetchWithTimeout('https://example.test/slow', {}, 25, fetchImpl);
    const timeoutExpectation = expect(request).rejects.toThrow('Timeout nach 25 ms');
    await vi.advanceTimersByTimeAsync(25);

    await timeoutExpectation;
    expect(observedSignal.aborted).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('honors Telegram retry_after after 429 and then succeeds', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(telegramResponse(429, {
        ok: false,
        description: 'Too Many Requests',
        parameters: { retry_after: 2 },
      }))
      .mockResolvedValueOnce(telegramResponse(200, {
        ok: true,
        result: { message_id: 42 },
      }));
    const sleepImpl = vi.fn().mockResolvedValue(undefined);

    const result = await notifyTelegram('daily report', {
      env: { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: 'chat' },
      fetchImpl,
      sleepImpl,
      random: () => 0,
      timeoutMs: 100,
      maxAttempts: 4,
      runId: 'run-429',
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledTimes(1);
    expect(sleepImpl).toHaveBeenCalledWith(2_000);
    expect(result).toEqual(expect.objectContaining({
      delivered: 1,
      failed: 0,
      chunks: 1,
      messageIds: [42],
    }));
    expect(result.error).toBeUndefined();
  });

  it('does not retry a permanent Telegram 401 response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(telegramResponse(401, {
      ok: false,
      description: 'Unauthorized',
    }));
    const sleepImpl = vi.fn().mockResolvedValue(undefined);

    const result = await notifyTelegram('daily report', {
      env: { TELEGRAM_BOT_TOKEN: 'bad-token', TELEGRAM_CHAT_ID: 'chat' },
      fetchImpl,
      sleepImpl,
      maxAttempts: 4,
      runId: 'run-401',
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleepImpl).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      delivered: 0,
      failed: 1,
      error: '401 Unauthorized',
    }));
  });

  it('exhausts retries after repeated Telegram network failures', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network unavailable'));
    const sleepImpl = vi.fn().mockResolvedValue(undefined);

    const result = await notifyTelegram('daily report', {
      env: { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: 'chat' },
      fetchImpl,
      sleepImpl,
      random: () => 0,
      timeoutMs: 100,
      maxAttempts: 3,
      runId: 'run-network',
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleepImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenNthCalledWith(1, 250);
    expect(sleepImpl).toHaveBeenNthCalledWith(2, 500);
    expect(result).toEqual(expect.objectContaining({
      delivered: 0,
      failed: 1,
      error: 'network unavailable',
    }));
  });

  it('returns already-delivered after a duplicate claim without health or Telegram fetches', async () => {
    const fetchImpl = vi.fn();
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    };
    const getSupabaseClient = vi.fn().mockReturnValue(supabase);
    const req = {
      method: 'GET',
      headers: {
        authorization: 'Bearer fallback-secret',
        'user-agent': 'independent-monitor/1.0',
      },
      query: { trigger: 'supabase-deadman' },
    };
    const res = responseMock();

    await handleHealthReport(req, res, {
      env: { MONITOR_FALLBACK_SECRET: 'fallback-secret' },
      fetchImpl,
      getSupabaseClient,
      now: () => new Date('2026-07-15T22:30:00.000Z'),
      randomUUID: () => 'duplicate-run',
    });

    expect(getSupabaseClient).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith('claim_health_report_run', {
      p_report_date: '2026-07-16',
      p_attempt_id: 'duplicate-run',
      p_trigger: 'supabase-deadman',
      p_lease_seconds: 180,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: 'already-delivered',
      reportDate: '2026-07-16',
      trigger: 'supabase-deadman',
    });
  });
});
