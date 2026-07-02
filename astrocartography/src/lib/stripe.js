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
 * birth data pays WITHOUT first creating an account. The birth data travels to
 * the server, which creates the Stripe session; Stripe Checkout collects the
 * email (pass one only to prefill it). After payment, webhook + verify-session
 * provision the account + premium + birth data and email a one-tap login link.
 * No JWT — identity is the email at checkout and the card they pay with.
 */
export async function redirectToGuestCheckout(birth, email = null) {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guest: true, ...(email ? { email } : {}), birth }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }
  window.location.href = data.url;
}
