import { supabase } from './supabase';

/**
 * Send an email via the server-side Resend API.
 * The API key never leaves the server — this calls /api/send-email which
 * runs as a Vercel Serverless Function.
 * Auth token is included so the server can verify the sender.
 */
export async function sendEmail({ to, subject, html }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers,
      body: JSON.stringify({ to, subject, html }),
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

// ─── Table-based branded HTML wrapper ───
// Uses tables for maximum email-client compatibility (Gmail, Outlook, Apple Mail, Yahoo, etc.)
function emailLayout(content) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>NatalNavigator</title>
  <!--[if mso]>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #0A1018; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- Outer wrapper table -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0A1018;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Inner content table -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; color: #00D88A; letter-spacing: 6px; line-height: 1.4;">
                    NATAL&nbsp;&nbsp;NAVIGATOR
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #5A7088; letter-spacing: 3px; padding-top: 6px; line-height: 1.4;">
                    YOUR PERSONAL ASTROCARTOGRAPHY MAP
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color: #0D1520; border: 1px solid #1A2840; border-radius: 12px; padding: 40px 32px;" bgcolor="#0D1520">
              <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding: 40px 32px;"><![endif]-->
              ${content}
              <!--[if mso]></td></tr></table><![endif]-->
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #2A3A50; line-height: 1.4;">
                    NATAL NAVIGATOR &copy; 2026
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <a href="https://natalnavigator.com" style="font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #1A2840; text-decoration: none;">natalnavigator.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Reusable CTA button (table-based for Outlook) ───
function ctaButton(text, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
  <tr>
    <td align="center" bgcolor="#00D88A" style="background-color: #00D88A; border-radius: 8px; mso-padding-alt: 14px 36px;">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" stroke="f" fillcolor="#00D88A"><w:anchorlock/><center style="color:#0A1018;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;">${text}</center></v:roundrect><![endif]-->
      <!--[if !mso]><!--><a href="${href}" target="_blank" style="display: inline-block; background-color: #00D88A; color: #0A1018; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-decoration: none; padding: 14px 36px; border-radius: 8px; line-height: 1.2;">
        ${text}
      </a><!--<![endif]-->
    </td>
  </tr>
</table>`;
}

/**
 * Send a welcome email after successful signup.
 */
export function sendWelcomeEmail(email) {
  return sendEmail({
    to: email,
    subject: 'Welcome to NatalNavigator — Your Stars Await',
    html: emailLayout(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 20px; font-size: 32px; line-height: 1;">&#10024;</td>
        </tr>
        <tr>
          <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; color: #D0DDE8; padding-bottom: 16px; line-height: 1.3;">
            Welcome to NatalNavigator
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #8A9BB0; line-height: 1.7; padding-bottom: 8px;">
            Your account has been created successfully.
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #8A9BB0; line-height: 1.7; padding-bottom: 28px;">
            Discover which cities on Earth align with your stars. Enter your birth data to generate your personalized natal chart and astrocartography globe.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 28px;">
            ${ctaButton('ENTER BIRTH DATA', 'https://natalnavigator.com/birth-data')}
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #5A7088; line-height: 1.5;">
            If you did not create this account, you can safely ignore this email.
          </td>
        </tr>
      </table>
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
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 20px; font-size: 32px; line-height: 1;">&#9993;&#65039;</td>
        </tr>
        <tr>
          <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; color: #D0DDE8; padding-bottom: 16px; line-height: 1.3;">
            Verify Your Email
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #8A9BB0; line-height: 1.7; padding-bottom: 28px;">
            Please confirm your email address to activate your NatalNavigator account.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 28px;">
            ${ctaButton('VERIFY EMAIL', confirmationUrl)}
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #5A7088; line-height: 1.5;">
            This link expires in 24 hours. If you did not sign up, ignore this email.
          </td>
        </tr>
      </table>
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
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 20px; font-size: 32px; line-height: 1;">&#128272;</td>
        </tr>
        <tr>
          <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; color: #D0DDE8; padding-bottom: 16px; line-height: 1.3;">
            Reset Your Password
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #8A9BB0; line-height: 1.7; padding-bottom: 28px;">
            We received a request to reset the password for your NatalNavigator account. Click the button below to choose a new password.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 28px;">
            ${ctaButton('RESET PASSWORD', resetUrl)}
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #5A7088; line-height: 1.5;">
            This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.
          </td>
        </tr>
      </table>
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
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #8A9BB0; line-height: 1.7;">
            ${message}
          </td>
        </tr>
      </table>
    `),
  });
}
