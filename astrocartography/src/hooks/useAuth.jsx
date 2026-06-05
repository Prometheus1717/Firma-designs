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
  const [showBirthDataModal, setShowBirthDataModal] = useState(false);
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
    const id = ++fetchIdRef.current;
    // Retry once on AbortError — that's the symptom of Supabase's auth-lock
    // contention when the same site is open in multiple tabs (or a token
    // refresh races with our profile fetch). Without this retry, the user
    // ended up with profile=null forever and was trapped in a loading state
    // they couldn't escape from.
    let data = null, error = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await supabase.from('profiles').select('*').eq('id', userId).single();
      data = res.data;
      error = res.error;
      if (!error) break;
      const msg = error.message || '';
      const isLockAbort = /AbortError|Lock broken|stolen|aborted/i.test(msg);
      if (!isLockAbort) break;
      // Brief jittered backoff so we don't slam into the same lock immediately.
      await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
    }
    if (error) console.error('[loadProfile]', error.message);
    if (id === fetchIdRef.current) {
      // Only update React state if the row actually changed — keeps profile
      // object identity stable across token refreshes so Dashboard's effects
      // and the globe don't re-fire for nothing. Also: if the fetch failed
      // (data === null), don't wipe an existing cached profile.
      if (data) {
        setProfile(prev => profileFieldsEqual(prev, data) ? prev : data);
        setCachedProfile(data);
      }
      // Mark "we now have a definitive answer about this user's profile" so
      // the route guards stop showing LoadingScreen. Set on both success and
      // failure paths — a failed lookup is still a resolved state from the
      // routing layer's point of view (fall through to the safe default).
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
    // Hard backstop for profileResolved: if the Supabase round-trip hangs
    // (auth-lock contention / dead network) we don't want the route guards
    // to show LoadingScreen forever. After 2.5 s give up and fall through —
    // user lands on demo + BirthDataModal which has a visible "Sign out"
    // link, so they can always escape.
    const profileResolveTimeout = setTimeout(() => setProfileResolved(true), 2500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      gotAuthRef.done = true;
      const u = session?.user ?? null;
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
            if (event !== 'TOKEN_REFRESHED') loadProfile(u.id);
          } else {
            const profileData = await loadProfile(u.id);
            clearTimeout(authTimeout);
            clearTimeout(absoluteTimeout);
            markReady();
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
        clearTimeout(authTimeout);
        clearTimeout(absoluteTimeout);
        clearTimeout(profileResolveTimeout);
        markReady();
      }
    });

    return () => {
      clearTimeout(authTimeout);
      clearTimeout(absoluteTimeout);
      clearTimeout(profileResolveTimeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const hasBirthData = !!(profile?.birth_date && profile?.birth_time && profile?.birth_lat != null && profile?.birth_lng != null);
  const isAdmin = profile?.is_admin === true;
  const isPremium = profile?.is_premium === true;
  const loading = !ready;

  // Drive the birth-data modal off auth state.
  // Important: we deliberately do NOT require `profile` to be non-null. If the
  // profile fetch failed (e.g. Supabase auth-lock contention from multiple
  // tabs returns AbortError), profile stays null but the user is still
  // authenticated. We must still surface the modal so they can at least sign
  // out via the modal's "Sign out" link — otherwise Dashboard's loading screen
  // covers everything and the user has no escape.
  useEffect(() => {
    if (!user) { setShowBirthDataModal(false); return; }
    if (hasBirthData) { setShowBirthDataModal(false); return; }
    if (!ready) return; // still resolving auth — don't decide yet
    // Admins never see the birth-data modal: they use the admin dashboard
    // and shouldn't be prompted to enter chart data they don't need.
    if (isAdmin) { setShowBirthDataModal(false); return; }
    if (isBirthModalDismissed()) { setShowBirthDataModal(false); return; }
    setShowBirthDataModal(true);
  }, [user, profile, hasBirthData, ready, isAdmin]);

  function dismissBirthDataModal() {
    setBirthModalDismissed(true);
    setShowBirthDataModal(false);
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
          // Same batched order as signIn — fetch first, set state together.
          let profileData = null;
          for (let attempt = 0; attempt < 2; attempt++) {
            const res = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            if (!res.error) { profileData = res.data; break; }
            if (!/AbortError|Lock broken|stolen|aborted/i.test(res.error.message || '')) break;
            await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
          }
          setUser(data.user);
          if (profileData) setProfile(profileData);
          setCachedProfile(profileData);
          setProfileResolved(true);
          setReady(true);
        }
        // No welcome email — Supabase already sends the confirmation email,
        // and the user explicitly wants only ONE message in the inbox to keep
        // the flow simple. The branded verify template in
        // supabase-email-templates.html doubles as the welcome moment.
        identifyUser(data.user.id, { email: data.user.email });
        trackEvent('user_signed_up', { email: data.user.email });
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
        let profileData = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (!res.error) { profileData = res.data; break; }
          if (!/AbortError|Lock broken|stolen|aborted/i.test(res.error.message || '')) break;
          await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
        }
        // Synchronous batch — React 18 coalesces these into a single render.
        setBirthModalDismissed(false);
        setUser(data.user);
        if (profileData) setProfile(profileData);
        setCachedProfile(profileData);
        setProfileResolved(true);
        identifyUser(data.user.id, { email: data.user.email, is_premium: profileData?.is_premium });
        trackEvent('user_signed_in');
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
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, profile, profileResolved, loading, hasBirthData, isAdmin, isPremium, showBirthDataModal, dismissBirthDataModal, signUp, signIn, signOut, deleteAccount, updateDisplayName, resetPassword, saveBirthData, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
