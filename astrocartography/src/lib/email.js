/**
 * Send an email via the server-side Resend API.
 *
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - Email body as HTML
 * @param {string} [options.from] - Sender address (defaults to noreply@natalnavigator.com)
 * @returns {Promise<{data?: object, error?: string}>}
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

/**
 * Send a welcome email to a new user.
 */
export function sendWelcomeEmail(email, name) {
  return sendEmail({
    to: email,
    subject: 'Welcome to NatalNavigator!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Welcome to NatalNavigator</h1>
        <p>Hi${name ? ` ${name}` : ''},</p>
        <p>Thank you for joining NatalNavigator! We're excited to help you explore your astrological chart and discover your astrocartography lines.</p>
        <p>Get started by entering your birth data to generate your personalized natal chart and globe visualization.</p>
        <p style="margin-top: 24px;">
          <a href="https://natalnavigator.com/birth-data"
             style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Enter Birth Data
          </a>
        </p>
        <p style="color: #888; margin-top: 32px; font-size: 12px;">
          — The NatalNavigator Team
        </p>
      </div>
    `,
  });
}

/**
 * Send a generic notification email.
 */
export function sendNotificationEmail(email, subject, message) {
  return sendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">NatalNavigator</h2>
        <p>${message}</p>
        <p style="color: #888; margin-top: 32px; font-size: 12px;">
          — The NatalNavigator Team
        </p>
      </div>
    `,
  });
}
