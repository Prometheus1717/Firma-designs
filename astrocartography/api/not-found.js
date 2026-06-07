import { applySecurityHeaders } from './_security.js';

export default function handler(req, res) {
  applySecurityHeaders(res);
  return res.status(404).json({ error: 'Not found' });
}
