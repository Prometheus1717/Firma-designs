import { createClient } from '@supabase/supabase-js';

// ─── Supabase admin client (service role — bypasses RLS) ───
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

// ─── CORS ───
const ALLOWED_ORIGINS = ['https://natalnavigator.com', 'https://www.natalnavigator.com'];

function getCorsHeaders(req) {
  const origin = req.headers.origin || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── In-memory rate limiter (per Vercel instance) ───
const _rateMap = new Map();
const RATE_LIMIT = 20;       // max requests
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

// ─── JWT verification + admin check ───
async function verifyAdmin(req, supabase) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return { error: 'Missing authorization token', status: 401 };
  }

  // Verify JWT via Supabase auth (service role client can verify any token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  // Check admin flag in profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return { error: 'Forbidden: admin access required', status: 403 };
  }

  return { user };
}

// ─── Action handlers ───

async function handleTogglePremium(supabase, body) {
  const { userId, isPremium } = body;
  if (!userId || typeof isPremium !== 'boolean') {
    return { error: 'userId (string) and isPremium (boolean) are required', status: 400 };
  }
  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { error: error.message, status: 500 };
  return { data: { success: true } };
}

async function handleUpdateSetting(supabase, body) {
  const { key, value } = body;
  if (!key || value === undefined) {
    return { error: 'key and value are required', status: 400 };
  }
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() });
  if (error) return { error: error.message, status: 500 };
  return { data: { success: true } };
}

async function handleUpdatePaywall(supabase, body) {
  const { enabled } = body;
  if (typeof enabled !== 'boolean') {
    return { error: 'enabled (boolean) is required', status: 400 };
  }
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'paywall_enabled', value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() });
  if (error) return { error: error.message, status: 500 };
  return { data: { success: true } };
}

async function handleFetchStats(supabase) {
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: recentSignups } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', weekAgo);

  const { count: withBirthData } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('birth_date', 'is', null);

  const { count: premiumUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_premium', true);

  return {
    data: {
      totalUsers: totalUsers || 0,
      recentSignups: recentSignups || 0,
      withBirthData: withBirthData || 0,
      premiumUsers: premiumUsers || 0,
    },
  };
}

async function handleFetchProfiles(supabase, body) {
  const {
    search = '',
    sortField = 'updated_at',
    sortAsc = false,
    page = 1,
    pageSize = 25,
  } = body;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (search) {
    const safe = search.replace(/[%_\\(),."']/g, c => '\\' + c);
    query = query.or(`display_name.ilike.%${safe}%,birth_city.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  query = query
    .order(sortField, { ascending: sortAsc })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) return { error: error.message, status: 500 };
  return { data: { data: data || [], total: count || 0 } };
}

async function handleFetchSettings(supabase) {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value, updated_at');
  if (error) return { error: error.message, status: 500 };
  const map = {};
  (data || []).forEach(r => { map[r.key] = r.value; });
  return { data: map };
}

// ─── Main handler ───

export default async function handler(req, res) {
  const CORS_HEADERS = getCorsHeaders(req);

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // Rate limit by IP
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(`admin:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error('[admin] Supabase init failed:', err.message);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verify JWT and admin status
  const auth = await verifyAdmin(req, supabase);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { action, ...params } = req.body || {};
  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }

  let result;
  try {
    switch (action) {
      case 'togglePremium':
        result = await handleTogglePremium(supabase, params);
        break;
      case 'updateSetting':
        result = await handleUpdateSetting(supabase, params);
        break;
      case 'updatePaywall':
        result = await handleUpdatePaywall(supabase, params);
        break;
      case 'fetchStats':
        result = await handleFetchStats(supabase);
        break;
      case 'fetchProfiles':
        result = await handleFetchProfiles(supabase, params);
        break;
      case 'fetchSettings':
        result = await handleFetchSettings(supabase);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error(`[admin] Action "${action}" failed:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (result.error) {
    return res.status(result.status || 500).json({ error: result.error });
  }

  return res.status(200).json(result.data);
}
