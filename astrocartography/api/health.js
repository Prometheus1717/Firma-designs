import { applySecurityHeaders } from './_security.js';

export default function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const env = {
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
  };
  const allSet = Object.values(env).every(Boolean);
  const checks = {
    status: allSet ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
  };

  if (process.env.HEALTHCHECK_TOKEN && req.query?.verbose === process.env.HEALTHCHECK_TOKEN) {
    checks.env = env;
    if (!allSet) {
      checks.missing = Object.entries(env)
        .filter(([, v]) => !v)
        .map(([k]) => k);
    }
  }

  return res.status(allSet ? 200 : 503).json(checks);
}
