import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { applySecurityHeaders, getClientIp, getCorsHeaders, getRequestOrigin } from './_security.js';

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

// Singleton Supabase admin client — reuse across warm function invocations
let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  // VITE_SUPABASE_URL preferred (frontend-confirmed); strip any /rest/v\d+ suffix
  // mistakenly set in SUPABASE_URL — supabase-js expects the bare project URL.
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

// Verify Supabase JWT and return authenticated user
async function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req, res) {
  const CORS_HEADERS = getCorsHeaders(req);
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // Rate limit by IP
  const clientIp = getClientIp(req);
  if (isRateLimited(`checkout:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!stripeSecretKey || !priceId) {
    console.error('[checkout] Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const stripe = new Stripe(stripeSecretKey);
  const origin = getRequestOrigin(req);
  const body = (req.body && typeof req.body === 'object') ? req.body : {};

  // ── Guest checkout (data-first funnel) ──
  // An anonymous visitor who entered birth data and saw the teaser can pay
  // without an account. Identity = the email they type + the card they pay with;
  // the webhook provisions the account + premium + saves the birth data. No
  // account is ever created for an unpaid visitor. Rate-limited by IP above.
  if (body.guest === true) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const birth = (body.birth && typeof body.birth === 'object') ? body.birth : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!birth || !birth.date || !birth.time || birth.lat == null || birth.lng == null) {
      return res.status(400).json({ error: 'Missing birth data — please re-enter your details.' });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/result?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/result?payment=cancelled`,
        // Birth data rides in metadata (Stripe caps values at 500 chars) so the
        // webhook can persist it onto the newly-provisioned profile.
        metadata: {
          guest: '1',
          email,
          birth_date: String(birth.date).slice(0, 20),
          birth_time: String(birth.time).slice(0, 20),
          birth_lat: String(birth.lat).slice(0, 32),
          birth_lng: String(birth.lng).slice(0, 32),
          birth_city: (typeof birth.city === 'string' ? birth.city : '').slice(0, 200),
          display_name: (typeof birth.name === 'string' ? birth.name : '').slice(0, 120),
        },
      });
      return res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('[checkout] Error creating guest session:', err);
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }

  // ── Authenticated checkout: derive identity from JWT, not client body ──
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Use server-verified identity — ignore any client-supplied email/userId
  const email = user.email;
  const userId = user.id;

  if (!email) {
    return res.status(400).json({ error: 'No email associated with account' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/dashboard?payment=cancelled`,
      metadata: { userId },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Error creating session:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
