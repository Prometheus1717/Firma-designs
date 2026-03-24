export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    },
  };

  // If any env var is missing, report degraded
  const allSet = Object.values(checks.env).every(Boolean);
  if (!allSet) {
    checks.status = 'degraded';
    checks.missing = Object.entries(checks.env)
      .filter(([, v]) => !v)
      .map(([k]) => k);
  }

  return res.status(allSet ? 200 : 503).json(checks);
}
