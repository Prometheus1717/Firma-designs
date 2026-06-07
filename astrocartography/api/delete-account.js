import { createClient } from '@supabase/supabase-js';
import { applySecurityHeaders, getClientIp, getCorsHeaders } from './_security.js';

// ─── Self-service account deletion ───
// Hard-deletes the authenticated caller's auth.users row + profiles row.
// Previously the client-only flow only removed the profile row and called
// supabase.auth.signOut() — the auth.users record survived, so the deleted
// user could log back in, hit the BirthDataModal, and re-create their profile
// via the saveBirthData upsert, silently resurrecting the account.

// ─── In-memory rate limiter (per Vercel instance) ───
const _rateMap = new Map();
const RATE_LIMIT = 3;        // max requests
const RATE_WINDOW = 60_000;  // per 60 seconds

function isRateLimited(key) {
  const now = Date.now();
  let entry = _rateMap.get(key);
  if (!entry || now - entry.start > RATE_WINDOW) {
    entry = { start: now, count: 1 };
    _rateMap.set(key, entry);
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// Singleton service-role client — reused across warm invocations.
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

export default async function handler(req, res) {
  const CORS_HEADERS = getCorsHeaders(req);
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // Rate limit by IP — deletion is a destructive action, keep it tight.
  const clientIp = getClientIp(req);
  if (isRateLimited(`delete:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error('[delete-account] Supabase init failed:', err.message);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Authenticate the caller via their Supabase JWT — we delete *their own*
  // account, no admin privilege needed (and explicitly NOT an admin endpoint
  // so admins don't accidentally delete users from here).
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Delete the profile row first. The trigger on auth.users that auto-creates
  // a profile fires on INSERT, so deleting profiles before auth.users is the
  // correct order. Service-role bypasses RLS so this always succeeds for any
  // valid user.
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);
  if (profileError) {
    console.error('[delete-account] profile delete failed:', profileError.message);
    // Continue anyway — the auth.users delete is the authoritative step.
  }

  // Hard-delete the auth.users record so the email is freed up and the user
  // can sign up again with the same address. Without this, re-login resurrects
  // the account via the saveBirthData upsert path.
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[delete-account] auth user delete failed:', deleteError.message);
    return res.status(500).json({ error: 'Failed to delete account. Please contact support.' });
  }

  return res.status(200).json({ success: true });
}
