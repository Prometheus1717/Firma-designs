/* global process, fetch */

const TELEGRAM_API_BASE = 'https://api.telegram.org';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatAmount(amount, currency) {
  if (!Number.isFinite(amount)) return null;
  const cur = String(currency || 'eur').toUpperCase();
  return `${(amount / 100).toFixed(2)} ${cur}`;
}

function getChatIds() {
  const raw = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_IDS || '';
  return raw.split(',').map(id => id.trim()).filter(Boolean);
}

export async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getChatIds();

  if (!token || chatIds.length === 0) {
    console.warn('[telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID, skipping notification');
    return;
  }

  await Promise.allSettled(chatIds.map(async (chatId) => {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Telegram send failed (${res.status}): ${body}`);
    }
  })).then(results => {
    results.forEach(result => {
      if (result.status === 'rejected') console.error('[telegram]', result.reason);
    });
  });
}

export function buildSignupMessage({ userId, email, createdAt }) {
  return [
    '<b>Natal Navigator: new signup</b>',
    `Email: ${escapeHtml(email || 'unknown')}`,
    `User ID: <code>${escapeHtml(userId || 'unknown')}</code>`,
    createdAt ? `Created: ${escapeHtml(createdAt)}` : null,
  ].filter(Boolean).join('\n');
}

export function buildPaymentMessage({ userId, email, amount, currency, stripeCustomerId, sessionId }) {
  return [
    '<b>Natal Navigator: payment received</b>',
    `Email: ${escapeHtml(email || 'unknown')}`,
    `Amount: ${escapeHtml(formatAmount(amount, currency) || 'unknown')}`,
    `User ID: <code>${escapeHtml(userId || 'unknown')}</code>`,
    stripeCustomerId ? `Stripe customer: <code>${escapeHtml(stripeCustomerId)}</code>` : null,
    sessionId ? `Checkout session: <code>${escapeHtml(sessionId)}</code>` : null,
  ].filter(Boolean).join('\n');
}
