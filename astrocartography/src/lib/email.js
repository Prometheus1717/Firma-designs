/**
 * Send an email via the server-side Resend API.
 * The API key never leaves the server — this calls /api/send-email which
 * runs as a Vercel Serverless Function.
 */
export async function sendEmail({ to, subject, html, from }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, from }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || 'Failed to send email' };
    }

    return { data: result.data };
  } catch (err) {
    return { error: 'Network error — could not send email' };
  }
}

// ─── Branded HTML wrapper ───
function emailLayout(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A1018;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:20px;font-weight:700;color:#00D88A;letter-spacing:6px;font-family:'Courier New',monospace;">NATAL NAVIGATOR</div>
      <div style="font-size:9px;color:#5A7088;letter-spacing:2px;margin-top:6px;font-family:'Courier New',monospace;">YOUR PERSONAL ASTROCARTOGRAPHY MAP</div>
    </div>
    <!-- Card -->
    <div style="background:#0D1520;border:1px solid #1A2840;border-radius:12px;padding:32px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <div style="font-size:10px;color:#2A3A50;font-family:'Courier New',monospace;">NATAL NAVIGATOR &copy; 2026</div>
      <div style="font-size:9px;color:#1A2840;margin-top:8px;">
        <a href="https://natalnavigator.com" style="color:#1A2840;text-decoration:none;">natalnavigator.com</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send a welcome email after successful signup.
 */
export function sendWelcomeEmail(email) {
  return sendEmail({
    to: email,
    subject: 'Welcome to NatalNavigator — Your Stars Await',
    html: emailLayout(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;">&#10024;</div>
      </div>
      <h1 style="color:#D0DDE8;font-size:18px;font-weight:700;text-align:center;margin:0 0 16px;">Welcome to NatalNavigator</h1>
      <p style="color:#8A9BB0;font-size:14px;line-height:1.7;text-align:center;margin:0 0 8px;">
        Your account has been created successfully.
      </p>
      <p style="color:#8A9BB0;font-size:14px;line-height:1.7;text-align:center;margin:0 0 24px;">
        Discover which cities on Earth align with your stars. Enter your birth data to generate your personalized natal chart and astrocartography globe.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://natalnavigator.com/birth-data"
           style="display:inline-block;background:#00D88A;color:#0A1018;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;">
          ENTER BIRTH DATA
        </a>
      </div>
      <p style="color:#5A7088;font-size:11px;text-align:center;margin:24px 0 0;">
        If you did not create this account, you can safely ignore this email.
      </p>
    `),
  });
}

/**
 * Send an email verification reminder.
 * (Used when Supabase email confirmation is enabled)
 */
export function sendVerificationEmail(email, confirmationUrl) {
  return sendEmail({
    to: email,
    subject: 'Verify your NatalNavigator email',
    html: emailLayout(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;">&#9993;</div>
      </div>
      <h1 style="color:#D0DDE8;font-size:18px;font-weight:700;text-align:center;margin:0 0 16px;">Verify Your Email</h1>
      <p style="color:#8A9BB0;font-size:14px;line-height:1.7;text-align:center;margin:0 0 24px;">
        Please confirm your email address to activate your NatalNavigator account.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${confirmationUrl}"
           style="display:inline-block;background:#00D88A;color:#0A1018;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;">
          VERIFY EMAIL
        </a>
      </div>
      <p style="color:#5A7088;font-size:11px;text-align:center;margin:24px 0 0;">
        This link expires in 24 hours. If you did not sign up, ignore this email.
      </p>
    `),
  });
}

/**
 * Send a password reset email.
 */
export function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail({
    to: email,
    subject: 'Reset your NatalNavigator password',
    html: emailLayout(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;">&#128272;</div>
      </div>
      <h1 style="color:#D0DDE8;font-size:18px;font-weight:700;text-align:center;margin:0 0 16px;">Reset Your Password</h1>
      <p style="color:#8A9BB0;font-size:14px;line-height:1.7;text-align:center;margin:0 0 24px;">
        We received a request to reset the password for your NatalNavigator account. Click the button below to choose a new password.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}"
           style="display:inline-block;background:#00D88A;color:#0A1018;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;">
          RESET PASSWORD
        </a>
      </div>
      <p style="color:#5A7088;font-size:11px;text-align:center;margin:24px 0 0;">
        This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.
      </p>
    `),
  });
}

/**
 * Send a generic notification email.
 */
export function sendNotificationEmail(email, subject, message) {
  return sendEmail({
    to: email,
    subject,
    html: emailLayout(`
      <p style="color:#8A9BB0;font-size:14px;line-height:1.7;">${message}</p>
    `),
  });
}
