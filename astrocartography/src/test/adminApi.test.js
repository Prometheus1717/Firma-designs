import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn().mockReturnThis();
const mockOr = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
const mockGte = vi.fn().mockReturnThis();
const mockNot = vi.fn().mockResolvedValue({ count: 5 });

const headResult = { count: 10 };
const headChain = () => ({
  gte: vi.fn().mockResolvedValue(headResult),
  not: vi.fn().mockResolvedValue({ count: 5 }),
  eq: vi.fn().mockResolvedValue(headResult),
  then: (cb) => cb(headResult),
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn((sel, opts) => {
        if (opts?.head) {
          return headChain();
        }
        if (sel === 'key, value') {
          return Promise.resolve({ data: [{ key: 'paywall_enabled', value: 'true' }], error: null });
        }
        return {
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: [{ id: '1' }], count: 1, error: null }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: [{ id: '1' }, { id: '2' }], count: 2, error: null }),
          }),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { value: 'true' }, error: null }),
          }),
        };
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })),
  },
}));

import { fetchAllProfiles, fetchAdminStats, fetchAllAppSettings, updateAppSetting, fetchPaywallSetting } from '../lib/adminApi';

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllProfiles', () => {
    it('returns data and total', async () => {
      const result = await fetchAllProfiles();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('accepts search parameter', async () => {
      const result = await fetchAllProfiles({ search: 'test' });
      expect(result).toHaveProperty('data');
    });

    it('accepts pagination parameters', async () => {
      const result = await fetchAllProfiles({ page: 2, pageSize: 10 });
      expect(result).toHaveProperty('data');
    });

    it('accepts sort parameters', async () => {
      const result = await fetchAllProfiles({ sortField: 'email', sortAsc: true });
      expect(result).toHaveProperty('data');
    });
  });

  describe('fetchAdminStats', () => {
    it('returns stats object', async () => {
      const result = await fetchAdminStats();
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('recentSignups');
      expect(result).toHaveProperty('withBirthData');
      expect(result).toHaveProperty('premiumUsers');
    });

    it('returns numeric values', async () => {
      const result = await fetchAdminStats();
      expect(typeof result.totalUsers).toBe('number');
      expect(typeof result.recentSignups).toBe('number');
      expect(typeof result.withBirthData).toBe('number');
      expect(typeof result.premiumUsers).toBe('number');
    });
  });

  describe('fetchAllAppSettings', () => {
    it('returns settings map', async () => {
      const result = await fetchAllAppSettings();
      expect(typeof result).toBe('object');
    });
  });

  describe('updateAppSetting', () => {
    it('does not throw on valid input', async () => {
      await expect(updateAppSetting('display_price', '4.99')).resolves.not.toThrow();
    });
  });

  describe('fetchPaywallSetting', () => {
    it('returns a boolean', async () => {
      const result = await fetchPaywallSetting();
      expect(typeof result).toBe('boolean');
    });
  });
});
