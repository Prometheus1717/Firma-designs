import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { identifyUser, resetUser, trackEvent } from '../lib/posthog';

const AuthContext = createContext(null);

// ─── Rate limiter ───
// Prevents brute-force auth attempts client-side.
// Tracks per-action timestamps and blocks when threshold exceeded.
const _rateLimits = {};
function checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  if (!_rateLimits[action]) _rateLimits[action] = [];
  // Prune expired entries
  _rateLimits[action] = _rateLimits[action].filter(t => now - t < windowMs);
  if (_rateLimits[action].length >= maxAttempts) {
    const oldestInWindow = _rateLimits[action][0];
    const waitSec = Math.ceil((windowMs - (now - oldestInWindow)) / 1000);
    throw new Error(`Too many attempts. Please wait ${waitSec}s before trying again.`);
  }
  _rateLimits[action].push(now);
}

// ─── sessionStorage profile cache ───
// Eliminates the Supabase profile round-trip within a browser session.
// Uses sessionStorage (not localStorage) so sensitive birth data doesn't persist
// across sessions — reduces XSS blast radius.
const PROFILE_CACHE_KEY = 'nn_profile';

function getCachedProfile() {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    // Expire after 1h within session
    if (Date.now() - (cached.ts || 0) > 3600000) return null;
    return cached.data;
  } catch { return null; }
}

function setCachedProfile(data) {
  try {
    if (data) {
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } else {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch { /* sessionStorage full or disabled */ }
}

// Clean up old localStorage cache from previous versions
try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}

// ─── Persistent is_admin cache ───
// Cached in localStorage (NOT sessionStorage) keyed by user id, so it
// survives tab close / browser restart. Admin status is the one bit of
// profile data we MUST know before deciding routes — without persistence,
// every fresh tab races the profile fetch and risks dumping the admin on
// the demo + BirthDataModal trap if the fetch is slow, fails, or hits
// auth-lock contention. Keeping only the boolean (not the full row) means
// no birth data sits in localStorage, so the XSS blast-radius argument
// for sessionStorage is preserved.
const ADMIN_FLAG_KEY = 'nn_is_admin';
function getCachedIsAdmin(userId) {
  if (!userId) return false;
  try { return localStorage.getItem(ADMIN_FLAG_KEY) === userId; }
  catch { return false; }
}
function setCachedIsAdmin(userId, isAdmin) {
  try {
    if (userId && isAdmin) localStorage.setItem(ADMIN_FLAG_KEY, userId);
    else localStorage.removeItem(ADMIN_FLAG_KEY);
  } catch {}
}

// ─── "User has been welcomed" flag, per user id, in localStorage ───
// Drives the one-time "Email Verified / Welcome to NatalNavigator" popup.
// Persisting per-user-id (instead of a single global flag) means a second
// brand-new account on the same browser still gets its hero moment, and a
// returning user opening a fresh tab does NOT get bothered again. Stored
// as a JSON array of user ids so we can support multi-account browsers.
const WELCOMED_KEY = 'nn_welcomed';
function isWelcomed(userId) {
  if (!userId) return false;
  try {
    const raw = localStorage.getItem(WELCOMED_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(userId);
  } catch { return false; }
}
function markWelcomed(userId) {
  if (!userId) return;
  try {
    const raw = localStorage.getItem(WELCOMED_KEY);
    const list = raw ? (JSON.parse(raw) || []) : [];
    if (!Array.isArray(list)) return;
    if (!list.includes(userId)) {
      list.push(userId);
      // Cap the list so it can't grow unbounded on shared devices.
      while (list.length > 32) list.shift();
      localStorage.setItem(WELCOMED_KEY, JSON.stringify(list));
    }
  } catch {}
}

// Read cached profile once at module level — avoids minifier TDZ issues
// with useRef().current pattern inside component body
const _initialCachedProfile = getCachedProfile();

// Dismissal flag for the birth-data prompt. Persists for the browser session
// only — once a returning user dismisses, we don't re-pop the modal on every
// tab refocus / route change within the same session.
const BIRTH_MODAL_DISMISSED_KEY = 'nn_birth_modal_dismissed';
function isBirthModalDismissed() {
  try { return sessionStorage.getItem(BIRTH_MODAL_DISMISSED_KEY) === '1'; } catch { return false; }
}
function setBirthModalDismissed(v) {
  try {
    if (v) sessionStorage.setItem(BIRTH_MODAL_DISMISSED_KEY, '1');
    else sessionStorage.removeItem(BIRTH_MODAL_DISMISSED_KEY);
  } catch {}
}

async function notifySignup(user) {
  if (!user?.id || !user?.email || typeof fetch !== 'function') return;
  try {
    await fetch('/api/telegram-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    });
  } catch (err) {
    console.warn('[signup] Telegram notification failed:', err?.message || err);
  }
}

// ─── Shared robust profile fetcher ───
// Single source of truth for "get this user's profile, but never silently
// give up on a transient failure". Used by both loadProfile (inside the
// component) and the batched signIn/signUp paths (which need just the data
// without touching React state in flight).
//
// Retry policy: 5 attempts, exponential backoff 0.2/0.5/1.2/2.5/5 s
// (max ~9 s). Retries on anything that smells transient — network blip,
// auth-lock contention, 5xx, JWT refresh race, fetch abort. Stops only on
// PGRST116 (truthful "no row") so a brand-new user gets answered quickly.
function withTimeout(promise, ms) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Profile request timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function fetchProfileRobust(userId) {
  if (!userId) return { data: null, error: new Error('no user id'), notFound: false };
  let data = null;
  let error = null;
  const ATTEMPTS = 5;
  const BACKOFF = [200, 500, 1200, 2500, 5000];
  const ATTEMPT_TIMEOUT = 4500;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    try {
      const res = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).single(),
        ATTEMPT_TIMEOUT
      );
      data = res.data;
      error = res.error;
      if (!error && data) return { data, error: null, notFound: false };
      const msg = error?.message || '';
      if (/PGRST116|not\s+found|no\s+rows/i.test(msg)) {
        return { data: null, error: null, notFound: true };
      }
    } catch (e) {
      error = e;
    }
    if (attempt < ATTEMPTS - 1) {
      const base = BACKOFF[attempt];
      await new Promise(r => setTimeout(r, base + Math.floor(Math.random() * 150)));
    }
  }
  return { data: null, error: error || new Error('exhausted retries'), notFound: false };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => _initialCachedProfile);
  const [ready, setReady] = useState(false);
  // `profileResolved` tracks whether we have a definitive answer about the
  // profile (loaded successfully OR a load attempt finished without data).
  // Without this, the route guards in App.jsx made admin/dashboard/demo
  // decisions while profile was still null on the very first render after
  // signIn or a fresh page load, dumping admins on the demo + BirthDataModal
  // even though their profile in Supabase had is_admin=true. Initial value
  // mirrors whether we have a cached profile at module load — so the warm
  // path doesn't introduce a LoadingScreen for users who already have data.
  const [profileResolved, setProfileResolved] = useState(() => !!_initialCachedProfile);
  // `profileLoadFailed` flips true ONLY after the robust retry loop in
  // loadProfile has exhausted itself with no data. Distinguishes "profile is
  // confirmed empty / not found" from "we tried 5 times and the network /
  // auth-lock kept failing". The UI uses this to show a recovery screen
  // instead of degrading to a wrong-state route (e.g. sending a paid user
  // to /birth-data or back to the paywall after a transient blip).
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [showBirthDataModal, setShowBirthDataModal] = useState(false);
  // Fail closed: if settings cannot be read, payment remains required.
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  const fetchIdRef = useRef(0);
  const signingInRef = useRef(false);

  // Shallow structural equality for profile rows — used to suppress no-op
  // state updates that would otherwise cascade into Dashboard re-renders
  // and globe re-paints on every TOKEN_REFRESHED event.
  const profileFieldsEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b) return false;
    const keys = ['id','email','display_name','birth_date','birth_time','birth_lat','birth_lng','birth_city','is_admin','is_premium','updated_at'];
    for (const k of keys) if (a[k] !== b[k]) return false;
    return true;
  };

  const loadProfile = useCallback(async (userId) => {
    if (!userId) return null;
    const id = ++fetchIdRef.current;
    const { data, error, notFound } = await fetchProfileRobust(userId);
    if (error && !data) console.error('[loadProfile] persistent failure:', error.message || error);
    if (id === fetchIdRef.current) {
      if (data) {
        setProfile(prev => profileFieldsEqual(prev, data) ? prev : data);
        setCachedProfile(data);
        setCachedIsAdmin(userId, data.is_admin === true);
        setProfileLoadFailed(false);
      } else if (notFound) {
        setProfile(null);
        setCachedProfile(null);
        setCachedIsAdmin(userId, false);
        setProfileLoadFailed(false);
      } else if (error) {
        // Persistent failure — flip the flag so the UI can show a recovery
        // screen instead of routing the user to a wrong-state page. We do
        // NOT wipe any cached profile here: a stale profile is safer than
        // none for paywall/admin decisions until the user actively retries.
        setProfileLoadFailed(true);
      }
      // profileResolved=true means "we tried" (success OR failure). The
      // app uses profileLoadFailed to decide whether to trust the result.
      setProfileResolved(true);
    }
    return data;
  }, []);

  useEffect(() => {
    const readyRef = { done: false };
    const gotAuthRef = { done: false };
    const markReady = () => {
      if (!readyRef.done) { readyRef.done = true; setReady(true); }
    };
    const hasCached = !!_initialCachedProfile;
    // Safety timeout: only fires after we received the initial auth event.
    // This prevents flashing the wrong route when auth is still resolving.
    // 3s absolute max — on very slow mobile networks, better to show app than hang.
    const authTimeout = setTimeout(() => {
      if (gotAuthRef.done) markReady();
    }, hasCached ? 0 : 500);
    const absoluteTimeout = setTimeout(markReady, 1500);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      gotAuthRef.done = true;
      const u = session?.user ?? null;
      // Mark this device as a returning account holder once any session exists.
      // AuthPage uses this to default existing users to the "Welcome back" login
      // while brand-new visitors get the register form (better signup conversion).
      if (u) { try { localStorage.setItem('nn_returning', '1'); } catch { /* storage blocked */ } }
      // Keep user identity stable across TOKEN_REFRESHED / SIGNED_IN replays
      // for the same user — Supabase hands us a fresh object every time, but
      // React still re-renders the whole tree on `setUser` because identity
      // changed. Suppress when the underlying user id hasn't moved.
      setUser(prev => (prev?.id === u?.id ? prev : u));

      // PASSWORD_RECOVERY: Supabase logged the user in via reset link.
      // Redirect to /reset-password so they can actually change their password
      // instead of being sent to the dashboard. Guard against re-firing while
      // already on /reset-password — Supabase replays this event on token
      // refresh in some flows and would otherwise yank a working session away.
      if (event === 'PASSWORD_RECOVERY' && u) {
        markReady();
        if (!window.location.pathname.startsWith('/reset-password')) {
          // Use setTimeout to ensure React Router has mounted
          setTimeout(() => { window.location.replace('/reset-password'); }, 0);
        }
        return;
      }

      if (u) {
        if (!signingInRef.current) {
          identifyUser(u.id, { email: u.email });
          if (hasCached) {
            markReady();
            // Skip the background profile refetch on TOKEN_REFRESHED — the
            // token rotates every hour but the row hasn't changed. Without
            // this guard every tab-refocus produced a profile setState which
            // re-fired Dashboard's chart effect and re-painted the globe.
            if (event !== 'TOKEN_REFRESHED') {
              loadProfile(u.id).then(p => maybeWelcomeUser(u, p));
            }
          } else {
            const profileData = await loadProfile(u.id);
            clearTimeout(authTimeout);
            clearTimeout(absoluteTimeout);
            markReady();
            // Brand-new email-confirmation redirect lands here on the very
            // first page-load after the user clicks the link in their
            // inbox. maybeWelcomeUser will only trigger if the confirm was
            // <5 min ago AND we haven't welcomed this user before.
            maybeWelcomeUser(u, profileData);
          }
        }
      } else {
        fetchIdRef.current++;
        setProfile(null);
        setCachedProfile(null);
        // Reset profileResolved on logout so the next sign-in correctly
        // waits for a fresh profile fetch instead of inheriting the
        // previous user's "resolved" status.
        setProfileResolved(false);
        setProfileLoadFailed(false);
        clearTimeout(authTimeout);
        clearTimeout(absoluteTimeout);
        markReady();
      }
    });

    return () => {
      clearTimeout(authTimeout);
      clearTimeout(absoluteTimeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const hasBirthData = !!(profile?.birth_date && profile?.birth_time && profile?.birth_lat != null && profile?.birth_lng != null);
  const isAdmin = profile?.is_admin === true;
  // `isAdminKnown` answers: "do we have any signal at all that this user is
  // admin?". True when the live profile says so OR when localStorage from a
  // previous session remembers them as admin. Use this in route guards to
  // pre-empt the modal/demo path while profile is still loading on mobile.
  const isAdminKnown = isAdmin || getCachedIsAdmin(user?.id);
  const isPremium = profile?.is_premium === true;
  const requiresPayment = !!user && paywallEnabled === true && !isAdminKnown && !isPremium;
  const loading = !ready;

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setPaywallEnabled(true);
      return () => { cancelled = true; };
    }

    Promise.resolve(supabase.from('app_settings').select('key, value'))
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[paywall] settings load failed:', error.message || error);
          setPaywallEnabled(true);
          return;
        }
        const row = (data || []).find(r => r.key === 'paywall_enabled');
        setPaywallEnabled(row?.value !== 'false');
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[paywall] settings load failed:', err?.message || err);
          setPaywallEnabled(true);
        }
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  // The BirthDataModal does NOT auto-open on every sign-in. It only opens in
  // exactly one automatic situation: the user just confirmed their email and
  // is seeing the app for the very first time (see maybeWelcomeUser). Every
  // other case is manual. A profile-fetch failure is handled by
  // ProfileRecoveryScreen, not by pretending the user has no birth data.
  useEffect(() => {
    if (!user) { setShowBirthDataModal(false); return; }
    if (hasBirthData) { setShowBirthDataModal(false); return; }
  }, [user, hasBirthData]);

  // Called by sign-in and the initial auth event with the fully-loaded
  // profile in hand. Triggers the one-time hero welcome when ALL of the
  // following are true:
  //   - the user confirmed their email within the last 5 minutes (so this
  //     is the redirect from the Supabase confirmation link, not a return
  //     visit days later)
  //   - we have never marked this user as welcomed before
  //   - they're not an admin (admins go to /admin instead)
  //   - they don't already have a complete birth chart on file
  // Marks the welcomed flag the moment we decide to show, so even if the
  // user hard-refreshes mid-flow it won't re-trigger.
  function maybeWelcomeUser(u, profileData) {
    if (!u || !u.id) return;
    if (isWelcomed(u.id)) return;
    if (profileData?.is_admin === true) return;
    const hasBirth = !!(profileData?.birth_date && profileData?.birth_time
                        && profileData?.birth_lat != null && profileData?.birth_lng != null);
    if (hasBirth) return;
    const confirmedAtMs = u.email_confirmed_at ? new Date(u.email_confirmed_at).getTime() : 0;
    const justConfirmed = confirmedAtMs > 0 && Date.now() - confirmedAtMs < 5 * 60 * 1000;
    if (!justConfirmed) return;
    markWelcomed(u.id);
    setBirthModalDismissed(false);
    setShowBirthDataModal(true);
  }

  function dismissBirthDataModal() {
    setBirthModalDismissed(true);
    setShowBirthDataModal(false);
  }

  // Manual opener used by the "Enter birth data" CTA in the demo dashboard
  // header. Clears the dismiss flag so the modal definitely renders.
  function openBirthDataModal() {
    setBirthModalDismissed(false);
    setShowBirthDataModal(true);
  }

  async function signUp(email, password) {
    checkRateLimit('signup', 5, 300000); // 5 attempts per 5 minutes
    // Set signingInRef to prevent onAuthStateChange from racing with profile upsert
    signingInRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data?.user) {
        setBirthModalDismissed(false);
        // Profile-row creation is handled by the on_auth_user_created Postgres
        // trigger (handle_new_user) — no need for a client-side upsert that
        // would fail under RLS when email-confirmation is on and there's no
        // session yet. Kept as a defensive no-op fallback only when we already
        // have a session (auto-confirm flows / dev).
        if (data.session) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            updated_at: new Date().toISOString(),
          });
          // Same batched order as signIn — fetch (with full retry) first,
          // then set every piece of state in one synchronous block so React
          // 18 coalesces them into a single render and the route guards
          // never see a "user set, profile null" intermediate frame.
          const { data: profileData, error: profileErr, notFound } = await fetchProfileRobust(data.user.id);
          setUser(data.user);
          if (profileData) setProfile(profileData);
          else if (notFound) setProfile(null);
          if (profileData || notFound) setCachedProfile(profileData);
          setCachedIsAdmin(data.user.id, profileData?.is_admin === true);
          setProfileLoadFailed(!profileData && !!profileErr);
          setProfileResolved(true);
          setReady(true);
        }
        // No welcome email — Supabase already sends the confirmation email,
        // and the user explicitly wants only ONE message in the inbox to keep
        // the flow simple. The branded verify template in
        // supabase-email-templates.html doubles as the welcome moment.
        identifyUser(data.user.id, { email: data.user.email });
        trackEvent('user_signed_up', { email: data.user.email });
        notifySignup(data.user);
      }
      return data;
    } finally {
      signingInRef.current = false;
    }
  }

  async function signIn(email, password) {
    checkRateLimit('signin', 8, 60000); // 8 attempts per minute
    signingInRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data?.user) {
        // Fetch the profile BEFORE flipping setUser. Previously the order was
        // setUser → await loadProfile, which forced a render in between with
        // user set but profile still null/stale. AuthRoute saw "no admin flag"
        // and Navigate('/')'d the admin into the demo + BirthDataModal trap
        // before the real profile (with is_admin=true) arrived. Batching all
        // state into one synchronous block ensures the first render after
        // sign-in already has both.
        const { data: profileData, error: profileErr, notFound } = await fetchProfileRobust(data.user.id);
        // Synchronous batch — React 18 coalesces these into a single render.
        setBirthModalDismissed(false);
        setUser(data.user);
        if (profileData) setProfile(profileData);
        else if (notFound) setProfile(null);
        if (profileData || notFound) setCachedProfile(profileData);
        setCachedIsAdmin(data.user.id, profileData?.is_admin === true);
        setProfileLoadFailed(!profileData && !!profileErr);
        setProfileResolved(true);
        identifyUser(data.user.id, { email: data.user.email, is_premium: profileData?.is_premium });
        trackEvent('user_signed_in');
        // Edge case: user signs in manually right after confirming. The
        // 5 min window in maybeWelcomeUser catches it; if they signed in
        // hours later it won't fire.
        maybeWelcomeUser(data.user, profileData);
      }
      setReady(true);
      return data;
    } finally {
      signingInRef.current = false;
    }
  }

  // Sign-out must never silently fail. The previous version awaited
  // supabase.auth.signOut() BEFORE clearing local state — when that call
  // hit Supabase's auth-lock contention (multi-tab / token-refresh race) it
  // could throw, and the setUser(null) / setProfile(null) lines never ran,
  // leaving the user "still signed in" in React state with no way out.
  // New flow: wipe everything locally first so the UI flips instantly, then
  // ask Supabase to invalidate the remote session — and tolerate failure.
  function forceClearSupabaseTokens() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k));
      // Also clear the persistent admin flag — a different user may sign in
      // next on the same browser. Without this clear the previous admin's
      // status would carry over visually for a split second.
      localStorage.removeItem(ADMIN_FLAG_KEY);
    } catch {}
  }

  async function signOut() {
    trackEvent('user_signed_out');
    resetUser();
    fetchIdRef.current++;
    // Flip UI immediately — do not wait on the network.
    setUser(null);
    setProfile(null);
    setCachedProfile(null);
    setProfileResolved(false);
    setProfileLoadFailed(false);
    setBirthModalDismissed(false);
    forceClearSupabaseTokens();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Lock contention / network blip — local sign-out already done.
      console.warn('[signOut] supabase.auth.signOut failed:', err?.message);
    }
  }

  async function deleteAccount() {
    // Hard-delete via /api/delete-account: the endpoint uses the service-role
    // key to remove both the profile row AND the auth.users record. Without
    // that, "deleted" accounts came back to life on next login because the
    // saveBirthData upsert path re-created the profile row.
    if (!user) return;
    let serverError = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/delete-account', { method: 'POST', headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        serverError = body.error || `Deletion failed (HTTP ${res.status})`;
      }
    } catch (err) {
      serverError = err?.message || 'Network error during deletion';
    }
    if (serverError) {
      // Don't wipe local state — leave the user signed in so they can retry
      // and so they know the request didn't succeed. Throw so the UI surfaces
      // it instead of silently appearing to log them out.
      throw new Error(serverError);
    }
    // Server confirmed deletion — clear everything locally.
    trackEvent('account_deleted');
    resetUser();
    fetchIdRef.current++;
    setUser(null);
    setProfile(null);
    setCachedProfile(null);
    setProfileResolved(false);
    setProfileLoadFailed(false);
    setBirthModalDismissed(false);
    forceClearSupabaseTokens();
    try { await supabase.auth.signOut(); } catch {}
  }

  async function updateDisplayName(newName) {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: newName, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    setCachedProfile(data);
    setProfileLoadFailed(false);
    return data;
  }

  async function resetPassword(email) {
    checkRateLimit('reset', 3, 300000); // 3 attempts per 5 minutes
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  }

  async function saveBirthData(birthData) {
    if (requiresPayment) {
      throw new Error('Payment required before entering birth data.');
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        birth_date: birthData.date,
        birth_time: birthData.time,
        birth_city: birthData.city,
        birth_lat: birthData.lat,
        birth_lng: birthData.lng,
        display_name: birthData.name || profile?.display_name,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    setCachedProfile(data);
    setProfileLoadFailed(false);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, profile, profileResolved, profileLoadFailed, loading, hasBirthData, isAdmin, isAdminKnown, isPremium, paywallEnabled, requiresPayment, showBirthDataModal, dismissBirthDataModal, openBirthDataModal, signUp, signIn, signOut, deleteAccount, updateDisplayName, resetPassword, saveBirthData, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
