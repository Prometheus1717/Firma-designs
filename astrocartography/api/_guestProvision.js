import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { isStorableIsoDate } from './_birthDate.js';

// Shared guest-checkout provisioning, used by BOTH delivery paths:
//   1. api/stripe-webhook.js   — Stripe pushes checkout.session.completed
//   2. api/verify-session.js   — the buyer's own return to /result?session_id=…
// Two independent triggers mean a webhook outage, a misconfigured endpoint or
// a preview deployment (whose webhook points elsewhere) can never produce a
// "paid but got nothing" customer: whichever path runs first provisions, the
// other recognises the account is already set up and does nothing.

let _supabaseAdmin = null;
export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  // VITE_SUPABASE_URL preferred (frontend-confirmed); strip any /rest/v\d+ suffix
  // mistakenly set in SUPABASE_URL — supabase-js expects the bare project URL.
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}

const APP_ORIGIN = 'https://natalnavigator.com';

// ─── Guest welcome email ───
// The buyer is auto-signed-in on the purchase device (verify-session returns a
// one-time login token), so this email is the access path for OTHER devices.
// Its button carries NO one-time token — it opens the passwordless sign-in
// page with the email prefilled, which mints a fresh link every time and can
// therefore never be "expired". Best-effort: a failure here never fails
// provisioning.
async function sendGuestWelcomeEmail(email) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;
    const signinUrl = `${APP_ORIGIN}/auth?mode=login&email=${encodeURIComponent(email)}`;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'NatalNavigator <info@natalnavigator.com>',
      to: [email],
      subject: 'Your Natal Navigator map is ready — one-tap login',
      html: `<div style="font-family:Arial,Helvetica,sans-serif;background:#0A1018;color:#8A9BB0;padding:40px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#0D1520;border:1px solid #1A2840;border-radius:12px;padding:36px 28px;text-align:center;">
    <div style="font-family:'Courier New',monospace;font-size:20px;font-weight:700;color:#00D88A;letter-spacing:5px;">NATAL&nbsp;NAVIGATOR</div>
    <div style="font-size:26px;padding:22px 0 6px;">✨</div>
    <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#00D88A;padding-bottom:14px;">Premium Activated!</div>
    <p style="font-size:14px;line-height:1.7;color:#8A9BB0;margin:0 0 24px;">Your payment is confirmed and your personal astrocartography map is saved to your account. Open it on any device — no password needed: tap below and a one-tap sign-in link lands in this inbox.</p>
    <a href="${signinUrl}" style="display:inline-block;background:#00D88A;color:#0A1018;font-family:'Courier New',monospace;font-size:13px;font-weight:700;letter-spacing:1px;text-decoration:none;padding:14px 34px;border-radius:8px;">OPEN MY MAP</a>
    <p style="font-size:11px;color:#5A7088;margin:26px 0 0;">One-time purchase · lifetime access. This button never expires — it signs you in with ${email}.</p>
  </div>
</div>`,
    }).catch(err => console.error('[guest-provision] Welcome email failed:', err));
  } catch (err) {
    console.error('[guest-provision] sendGuestWelcomeEmail error:', err);
  }
}

// ─── Guest provisioning ───
// Find-or-create the account for the paying email, mark it premium, persist
// the birth data captured at checkout, and send the welcome email. Runs from
// BOTH the webhook and verify-session, often within the same second, so:
//  - account + profile writes are idempotent and always executed (whichever
//    caller runs, the buyer ends up provisioned), and
//  - one-time side effects (email, Telegram) belong to the caller that wins
//    the atomic per-session claim in guest_provision_claims.
// Returns { userId, email, alreadyProvisioned } — alreadyProvisioned=true
// means another caller owns the side effects.
export async function provisionGuestAccount(supabase, meta, customerEmail, stripeCustomerId, sessionId) {
  const email = String(meta.email || customerEmail || '').trim().toLowerCase();
  if (!email) throw new Error('guest checkout: no email');

  // Create the account (auto-confirmed — Stripe already verified a real email).
  let userId = null;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (!createErr && created?.user?.id) {
    userId = created.user.id;
  } else {
    // Already registered (returning visitor, earlier sign-up, or the other
    // delivery path was faster) — the profile row (id = auth user id) exists
    // for every user via the handle_new_user trigger.
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing?.id) userId = existing.id;
  }
  if (!userId) throw new Error(`guest checkout: could not resolve account for ${email}`);

  const update = {
    id: userId,
    email,
    is_premium: true,
    stripe_customer_id: stripeCustomerId,
    display_name: meta.display_name || null,
    updated_at: new Date().toISOString(),
  };
  // Never overwrite existing birth data with nulls — a signed-up user who
  // already entered their details and then bought as a guest keeps them.
  // An unstorable date is dropped rather than passed on: Postgres would reject
  // the whole upsert (22008), which used to leave a paying customer with no
  // account at all. Access is what they bought; the date they can retype.
  if (meta.birth_date && !isStorableIsoDate(meta.birth_date)) {
    console.error(`[guest-provision] Dropping unstorable birth_date "${meta.birth_date}" for ${email} — provisioning premium without it.`);
    meta = { ...meta, birth_date: '' };
  }
  if (meta.birth_date) {
    update.birth_date = meta.birth_date;
    update.birth_time = meta.birth_time || null;
    update.birth_city = meta.birth_city || null;
    update.birth_lat = meta.birth_lat != null && meta.birth_lat !== '' ? parseFloat(meta.birth_lat) : null;
    update.birth_lng = meta.birth_lng != null && meta.birth_lng !== '' ? parseFloat(meta.birth_lng) : null;
  }
  const { error: upErr } = await supabase.from('profiles').upsert(update, { onConflict: 'id' });
  if (upErr) throw upErr;

  // Atomic claim: exactly one caller per checkout session sends the email.
  // ignoreDuplicates makes the losing insert return zero rows instead of an
  // error. If the claim itself fails (e.g. table unreachable) we still send —
  // a duplicate email beats a customer who never gets access instructions.
  let claimed = true;
  if (sessionId) {
    try {
      const { data: claim, error: claimErr } = await supabase
        .from('guest_provision_claims')
        .upsert({ session_id: sessionId, user_id: userId }, { onConflict: 'session_id', ignoreDuplicates: true })
        .select('session_id');
      if (!claimErr) claimed = Array.isArray(claim) && claim.length > 0;
    } catch (err) {
      console.error('[guest-provision] claim check failed, sending anyway:', err);
    }
  }

  if (claimed) await sendGuestWelcomeEmail(email);
  return { userId, email, alreadyProvisioned: !claimed };
}
