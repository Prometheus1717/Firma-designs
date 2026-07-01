import { supabase } from './supabase';

/**
 * Creates a Stripe Checkout session and redirects the user to the payment page.
 * Identity is derived from the JWT server-side — no client-supplied email/userId trusted.
 */
export async function redirectToCheckout() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({}), // no client-supplied identity data
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }

  // Redirect to Stripe-hosted checkout page
  window.location.href = data.url;
}

/**
 * Guest checkout for the data-first funnel: an anonymous visitor who has entered
 * birth data and seen the teaser can pay WITHOUT first creating an account. The
 * email + birth data travel to the server, which creates the Stripe session; the
 * webhook provisions the account + premium + saves the birth data on payment.
 * No JWT — identity is the email the visitor types and the card they pay with.
 */
export async function redirectToGuestCheckout(email, birth) {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guest: true, email, birth }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }
  window.location.href = data.url;
}
