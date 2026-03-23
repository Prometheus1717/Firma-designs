import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sendWelcomeEmail } from '../lib/email';

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

// ─── localStorage profile cache ───
// Eliminates the Supabase profile round-trip for returning users.
// On mobile networks this saves 300ms-2s of blocking wait time.
const PROFILE_CACHE_KEY = 'nn_profile';

function getCachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    // Expire after 24h — forces a fresh fetch once a day
    if (Date.now() - (cached.ts || 0) > 86400000) return null;
    return cached.data;
  } catch { return null; }
}

function setCachedProfile(data) {
  try {
    if (data) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch { /* localStorage full or disabled */ }
}

// Read cached profile once at module level — avoids minifier TDZ issues
// with useRef().current pattern inside component body
const _initialCachedProfile = getCachedProfile();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => _initialCachedProfile);
  const [ready, setReady] = useState(false);
  const fetchIdRef = useRef(0);
  const signingInRef = useRef(false);

  const loadProfile = useCallback(async (userId) => {
    const id = ++fetchIdRef.current;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) console.error('[loadProfile]', error.message);
    if (id === fetchIdRef.current) {
      setProfile(data);
      setCachedProfile(data);
    }
    return data;
  }, []);

  useEffect(() => {
    const readyRef = { done: false };
    const markReady = () => {
      if (!readyRef.done) { readyRef.done = true; setReady(true); }
    };
    // If we have a cached profile, mark ready immediately — no waiting for network
    // The profile will be refreshed in the background.
    // Safety timeout: 2s max wait (was 3s) — on slow mobile networks, showing the
    // app with partial data is better than an indefinite loading screen.
    const hasCached = !!_initialCachedProfile;
    const authTimeout = setTimeout(markReady, hasCached ? 0 : 2000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      // PASSWORD_RECOVERY: Supabase logged the user in via reset link.
      // Redirect to /reset-password so they can actually change their password
      // instead of being sent to the dashboard.
      if (event === 'PASSWORD_RECOVERY' && u) {
        markReady();
        // Use setTimeout to ensure React Router has mounted
        setTimeout(() => { window.location.replace('/reset-password'); }, 0);
        return;
      }

      if (u) {
        if (!signingInRef.current) {
          if (hasCached) {
            markReady();
            loadProfile(u.id);
          } else {
            await loadProfile(u.id);
            clearTimeout(authTimeout);
            markReady();
          }
        }
      } else {
        fetchIdRef.current++;
        setProfile(null);
        setCachedProfile(null);
        clearTimeout(authTimeout);
        markReady();
      }
    });

    return () => { clearTimeout(authTimeout); subscription.unsubscribe(); };
  }, [loadProfile]);

  const hasBirthData = !!(profile?.birth_date && profile?.birth_time && profile?.birth_lat != null && profile?.birth_lng != null);
  const isAdmin = profile?.is_admin === true;
  const loading = !ready;

  async function signUp(email, password) {
    checkRateLimit('signup', 5, 300000); // 5 attempts per 5 minutes
    // Set signingInRef to prevent onAuthStateChange from racing with profile upsert
    signingInRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          updated_at: new Date().toISOString(),
        });
        // If auto-confirmed (session exists), load profile and mark ready
        if (data.session) {
          setUser(data.user);
          const profileData = await loadProfile(data.user.id);
          setCachedProfile(profileData);
          setReady(true);
        }
        // Send welcome email (fire-and-forget — don't block the signup flow)
        sendWelcomeEmail(data.user.email).catch(() => {});
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
        setUser(data.user);
        const profileData = await loadProfile(data.user.id);
        setCachedProfile(profileData);
      }
      setReady(true);
      return data;
    } finally {
      signingInRef.current = false;
    }
  }

  async function signOut() {
    fetchIdRef.current++;
    setCachedProfile(null);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function deleteAccount() {
    // Delete profile row first, then sign out
    // (Supabase user deletion requires admin/service role,
    //  so we mark the profile as deleted and sign out)
    if (user) {
      await supabase.from('profiles').delete().eq('id', user.id);
    }
    fetchIdRef.current++;
    setCachedProfile(null);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
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
    <AuthContext.Provider value={{ user, profile, loading, hasBirthData, isAdmin, signUp, signIn, signOut, deleteAccount, updateDisplayName, resetPassword, saveBirthData, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
