import Stripe from 'stripe';

const ALLOWED_ORIGINS = ['https://natalnavigator.com', 'https://www.natalnavigator.com'];

function getCorsHeaders(req) {
  const origin = req.headers.origin || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── In-memory rate limiter (per Vercel instance) ───
const _rateMap = new Map();
const RATE_LIMIT = 5;        // max checkout sessions
const RATE_WINDOW = 60_000;  // per 60 seconds

function isRateLimited(key) {
  const now = Date.now();
  let entry = _rateMap.get(key);
  if (!entry || now - entry.start > RATE_WINDOW) {
    entry = { start: now, count: 1 };
    _rateMap.set(key, entry);
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

export default async function handler(req, res) {
  const CORS_HEADERS = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // Rate limit by IP
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(`checkout:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!stripeSecretKey || !priceId) {
    console.error('[checkout] Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const { email, userId } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // Use 'subscription' for recurring
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'https://natalnavigator.com'}/dashboard?payment=success`,
      cancel_url: `${req.headers.origin || 'https://natalnavigator.com'}/dashboard?payment=cancelled`,
      metadata: { userId: userId || '' },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Error creating session:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
