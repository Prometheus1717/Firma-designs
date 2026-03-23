import Stripe from 'stripe';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

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
