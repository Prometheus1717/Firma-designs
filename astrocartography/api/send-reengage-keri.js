import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// ─── One-shot re-engagement send to a single specific user ───
// keririchardson711@hotmail.com signed up on 2026-06-06, confirmed the
// email, entered her/his birth data, and hit a 15 s timeout that destroyed
// the input (the bug that triggered the BirthDataPage hardening — longer
// timeout, automatic retry, localStorage draft cache). This endpoint sends
// a gender-neutral re-engagement note inviting them to try again. After
// success it locks in the public.email_send_log table so a replay of the
// URL cannot send the mail a second time. Delete this file after use.

const HARDCODED_RECIPIENT = 'keririchardson711@hotmail.com';
const SEND_KEY = 'keri-reengage-2026-06-07';
const FROM = 'NatalNavigator <info@natalnavigator.com>';
const SUBJECT = 'A small update — your NatalNavigator account is ready';

let _supabaseAdmin = null;
function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}

function htmlBody() {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>NatalNavigator</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#0A1018;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0A1018;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
        <tr><td align="center" style="padding-bottom:32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" style="font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:700;color:#00D88A;letter-spacing:6px;line-height:1.4;">NATAL&nbsp;&nbsp;NAVIGATOR</td></tr>
            <tr><td align="center" style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#5A7088;letter-spacing:3px;padding-top:6px;line-height:1.4;">YOUR PERSONAL ASTROCARTOGRAPHY MAP</td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color:#0D1520;border:1px solid #1A2840;border-radius:12px;padding:40px 32px;" bgcolor="#0D1520">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center" style="padding-bottom:20px;font-size:32px;line-height:1;">&#10024;</td></tr>
            <tr><td align="center" style="font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:700;color:#D0DDE8;padding-bottom:16px;line-height:1.3;">Welcome back</td></tr>
            <tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8A9BB0;line-height:1.7;padding-bottom:16px;">
              Hello, and thank you for trying NatalNavigator.
            </td></tr>
            <tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8A9BB0;line-height:1.7;padding-bottom:16px;">
              We noticed that your first attempt to enter birth details ran into a connection timeout, and the form was not saved. We have just released a small update that fixes this exact situation: anything you type is now stored locally as you go, the save retries automatically on a slow connection, and your data is never lost again — even if the network drops mid-save.
            </td></tr>
            <tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8A9BB0;line-height:1.7;padding-bottom:28px;">
              Your account is still active and waiting. If you have a moment, we would love for you to try again.
            </td></tr>
            <tr><td align="center" style="padding-bottom:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
                <td align="center" bgcolor="#00D88A" style="background-color:#00D88A;border-radius:8px;mso-padding-alt:14px 36px;">
                  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://natalnavigator.com/birth-data" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%" stroke="f" fillcolor="#00D88A"><w:anchorlock/><center style="color:#0A1018;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;">PICK UP WHERE YOU LEFT</center></v:roundrect><![endif]-->
                  <!--[if !mso]><!--><a href="https://natalnavigator.com/birth-data" target="_blank" style="display:inline-block;background-color:#00D88A;color:#0A1018;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;letter-spacing:1px;text-decoration:none;padding:14px 36px;border-radius:8px;line-height:1.2;">PICK UP WHERE YOU LEFT</a><!--<![endif]-->
                </td>
              </tr></table>
            </td></tr>
            <tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#5A7088;line-height:1.5;">
              No additional sign-up needed — your existing login still works. If you have any trouble at all, simply reply to this email and we will help.
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#2A3A50;line-height:1.4;">NATAL NAVIGATOR &copy; 2026</td></tr>
            <tr><td align="center" style="padding-top:8px;"><a href="https://natalnavigator.com" style="font-family:'Courier New',Courier,monospace;font-size:9px;color:#1A2840;text-decoration:none;">natalnavigator.com</a></td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  // Idempotency: refuse to re-send if we already logged this send key.
  let supabase;
  try { supabase = getSupabaseAdmin(); }
  catch (e) { return res.status(500).json({ error: 'Supabase admin init failed' }); }

  const { data: existing } = await supabase
    .from('email_send_log')
    .select('id, sent_at')
    .eq('send_key', SEND_KEY)
    .maybeSingle();
  if (existing) {
    return res.status(200).json({ ok: true, already_sent_at: existing.sent_at, send_key: SEND_KEY });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY missing' });

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [HARDCODED_RECIPIENT],
      subject: SUBJECT,
      html: htmlBody(),
    });
    if (error) return res.status(502).json({ error: error.message || 'Resend rejected' });

    await supabase.from('email_send_log').insert({
      send_key: SEND_KEY,
      recipient: HARDCODED_RECIPIENT,
      subject: SUBJECT,
    });
    return res.status(200).json({ ok: true, resend_id: data?.id, recipient: HARDCODED_RECIPIENT });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'unknown' });
  }
}
