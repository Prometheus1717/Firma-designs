import { createClient } from '@supabase/supabase-js';

// ─── Supabase admin client (service role — bypasses RLS) ───
// Singleton: reuse across warm function invocations to avoid connection pool exhaustion
let _supabaseAdmin = null;
function getSupabaseAdmin() {
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
  // Pull the full signup → confirm → activation funnel from a single
  // server-side function (auth.users joined to profiles). This is the only
  // honest "user count" — `profiles` alone doesn't distinguish signed-up
  // from activated, and the previous "totalUsers" was just COUNT(profiles)
  // which inflated the number with people who never entered birth data.
  const { data: funnel } = await supabase.rpc('get_funnel_stats');
  const f = funnel || {};

  const { count: premiumUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_premium', true);

  return {
    data: {
      // New funnel-shaped fields. The admin UI reads these directly.
      signedUp: f.signed_up || 0,                 // entered email+password
      emailConfirmed: f.email_confirmed || 0,     // clicked confirm link
      activated: f.activated || 0,                // entered full birth chart
      signedUp7d: f.signed_up_7d || 0,
      confirmed7d: f.confirmed_7d || 0,
      activated7d: f.activated_7d || 0,
      premiumUsers: premiumUsers || 0,
      // Legacy keys kept for back-compat with any old UI code paths:
      totalUsers: f.signed_up || 0,
      recentSignups: f.signed_up_7d || 0,
      withBirthData: f.activated || 0,
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
    // Default to activated users only — i.e. people who entered the full
    // birth chart and actually used the product. The handle_new_user trigger
    // backfill flooded the profiles table with rows for old auth.users that
    // signed up months ago but never made it past the BirthDataModal, and
    // the admin list is meant to surface real users, not abandoned signups.
    // Pass `activatedOnly: false` from the client to see the raw list.
    activatedOnly = true,
  } = body;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (activatedOnly) {
    // "Activated" = entered all four birth fields, matching the same
    // definition used by get_funnel_stats so the user-list total lines up
    // with the activation stat on the Overview tab.
    query = query
      .not('birth_date', 'is', null)
      .not('birth_time', 'is', null)
      .not('birth_lat',  'is', null)
      .not('birth_city', 'is', null);
  }

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

// ─── Demographics (aggregated from profiles) ───

// Date `years` ago in YYYY-MM-DD — used as birth_date cutoffs for age buckets.
function yearsAgoISO(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

async function handleFetchDemographics(supabase) {
  // Age bucket boundaries expressed as birth_date cutoffs (age N ⟺ birth_date ≤ today − N years).
  const c18 = yearsAgoISO(18);
  const c26 = yearsAgoISO(26);
  const c36 = yearsAgoISO(36);
  const c46 = yearsAgoISO(46);
  const c56 = yearsAgoISO(56);

  // Cheap count-only queries (head:true) keep this scalable — no row transfer.
  const countQ = () => supabase.from('profiles').select('*', { count: 'exact', head: true });
  const trendSince = new Date(Date.now() - 29 * 86400000).toISOString();

  const [under18, a18, a26, a36, a46, a56, totalRes, premiumRes, recent, ageStatsRes, birthCitiesRes] = await Promise.all([
    countQ().gt('birth_date', c18),
    countQ().lte('birth_date', c18).gt('birth_date', c26),
    countQ().lte('birth_date', c26).gt('birth_date', c36),
    countQ().lte('birth_date', c36).gt('birth_date', c46),
    countQ().lte('birth_date', c46).gt('birth_date', c56),
    countQ().lte('birth_date', c56),
    countQ(),
    countQ().eq('is_premium', true),
    supabase.from('profiles').select('created_at').gte('created_at', trendSince),
    supabase.rpc('get_age_stats'),
    // Birth-country breakdown — pull only the one column for every profile that
    // has a birth_city. Cheap because birth_city is short text; aggregation is
    // done in JS to keep the SQL surface small. If profile count ever pushes
    // past ~50k, swap this for a Postgres view that does the GROUP BY server
    // side (see SQL in the function below for the equivalent shape).
    supabase.from('profiles').select('birth_city').not('birth_city', 'is', null).limit(50000),
  ]);

  const ageBuckets = [
    { label: '<18', count: under18.count || 0 },
    { label: '18-25', count: a18.count || 0 },
    { label: '26-35', count: a26.count || 0 },
    { label: '36-45', count: a36.count || 0 },
    { label: '46-55', count: a46.count || 0 },
    { label: '56+', count: a56.count || 0 },
  ];

  const total = totalRes.count || 0;
  const premium = premiumRes.count || 0;

  // Signup trend — bucket recent created_at by day across the last 30 days.
  const trendMap = {};
  for (let i = 29; i >= 0; i--) {
    trendMap[new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)] = 0;
  }
  (recent.data || []).forEach(r => {
    const key = r.created_at ? String(r.created_at).slice(0, 10) : null;
    if (key && key in trendMap) trendMap[key]++;
  });
  const signupTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

  const as = ageStatsRes.data || {};
  const ageStats = {
    avg: as.avg != null ? Number(as.avg) : null,
    median: as.median != null ? Number(as.median) : null,
    min: as.min != null ? Number(as.min) : null,
    max: as.max != null ? Number(as.max) : null,
    count: as.count != null ? Number(as.count) : 0,
  };

  // Birth-country breakdown.
  // birth_city is built by BirthDataModal.jsx as "City[, State], ISO2" where
  // ISO2 is the 2-letter uppercase Nominatim country_code. We pop the last
  // comma-separated segment and treat anything that isn't a clean ISO-2 as
  // "OTHER" — keeps the chart readable when a few legacy rows have non-
  // canonical formatting.
  const countryCounts = {};
  (birthCitiesRes.data || []).forEach(({ birth_city }) => {
    if (!birth_city || typeof birth_city !== 'string') return;
    const last = birth_city.split(',').pop().trim();
    const code = /^[A-Z]{2}$/.test(last) ? last : 'OTHER';
    countryCounts[code] = (countryCounts[code] || 0) + 1;
  });
  const sortedCountries = Object.entries(countryCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
  // Keep the top 12 and roll everything else into a single "OTHER" so the
  // chart stays compact even at long-tail scale.
  const topCountries = sortedCountries.slice(0, 12);
  const tailCount = sortedCountries.slice(12).reduce((s, c) => s + c.count, 0);
  if (tailCount > 0) {
    const existingOther = topCountries.find(c => c.code === 'OTHER');
    if (existingOther) existingOther.count += tailCount;
    else topCountries.push({ code: 'OTHER', count: tailCount });
  }
  const totalWithCountry = sortedCountries.reduce((s, c) => s + c.count, 0);

  return {
    data: {
      ageBuckets,
      ageStats,
      withBirthData: ageBuckets.reduce((s, b) => s + b.count, 0),
      total,
      premium,
      free: Math.max(0, total - premium),
      signupTrend,
      topCountries,           // [{ code: 'DE', count: 42 }, ...] desc
      totalWithCountry,       // sum of all country-attributed profiles
    },
  };
}

// ─── Usage analytics (PostHog Query API) ───
// Uses a server-side personal API key so the secret never reaches the client.
function getPostHogConfig() {
  const personalKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!personalKey || !projectId) return null;
  // The query API lives on the app host (e.g. us.posthog.com), NOT the ingestion
  // host (us.i.posthog.com). Allow an explicit override, else derive it.
  let host = process.env.POSTHOG_API_HOST
    || (process.env.VITE_POSTHOG_HOST || '').replace('.i.posthog.com', '.posthog.com')
    || 'https://us.posthog.com';
  host = host.replace(/\/+$/, '');
  return { personalKey, projectId, host };
}

async function posthogQuery(cfg, hogql) {
  const res = await fetch(`${cfg.host}/api/projects/${cfg.projectId}/query/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.personalKey}`,
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`PostHog API ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

async function handleFetchUsage() {
  const cfg = getPostHogConfig();
  if (!cfg) return { data: { configured: false } };

  const usageSQL = `
    SELECT
      uniqIf(person_id, timestamp >= now() - INTERVAL 1 DAY)  AS dau,
      uniqIf(person_id, timestamp >= now() - INTERVAL 7 DAY)  AS wau,
      uniqIf(person_id, timestamp >= now() - INTERVAL 30 DAY) AS mau,
      countIf(timestamp >= now() - INTERVAL 1 DAY)  AS opens24h,
      countIf(timestamp >= now() - INTERVAL 7 DAY)  AS opens7d,
      countIf(timestamp >= now() - INTERVAL 30 DAY) AS opens30d
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 30 DAY`;

  // Session duration computed from event timestamps — robust to schema specifics.
  const durationSQL = `
    SELECT round(avg(dur)) AS avg_seconds, round(median(dur)) AS median_seconds, count() AS sessions
    FROM (
      SELECT dateDiff('second', min(timestamp), max(timestamp)) AS dur
      FROM events
      WHERE timestamp >= now() - INTERVAL 30 DAY AND notEmpty(properties.$session_id)
      GROUP BY properties.$session_id
    )`;

  try {
    const [usage, duration] = await Promise.all([
      posthogQuery(cfg, usageSQL),
      posthogQuery(cfg, durationSQL),
    ]);
    const u = usage.results?.[0] || [];
    const d = duration.results?.[0] || [];
    return {
      data: {
        configured: true,
        dau: Number(u[0]) || 0,
        wau: Number(u[1]) || 0,
        mau: Number(u[2]) || 0,
        opens24h: Number(u[3]) || 0,
        opens7d: Number(u[4]) || 0,
        opens30d: Number(u[5]) || 0,
        avgSessionSeconds: Number(d[0]) || 0,
        medianSessionSeconds: Number(d[1]) || 0,
        totalSessions: Number(d[2]) || 0,
      },
    };
  } catch (err) {
    console.error('[admin] PostHog query failed:', err.message);
    return { data: { configured: true, error: 'PostHog query failed' } };
  }
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
      case 'fetchDemographics':
        result = await handleFetchDemographics(supabase);
        break;
      case 'fetchUsage':
        result = await handleFetchUsage();
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
