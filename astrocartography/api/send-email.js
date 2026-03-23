import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const { to, subject, html, from } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: from || 'NatalNavigator <noreply@natalnavigator.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
