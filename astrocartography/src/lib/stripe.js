/**
 * Creates a Stripe Checkout session and redirects the user to the payment page.
 * Called from the frontend when user clicks "Upgrade" / "Buy" button.
 */
export async function redirectToCheckout(email, userId) {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, userId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }

  // Redirect to Stripe-hosted checkout page
  window.location.href = data.url;
}
