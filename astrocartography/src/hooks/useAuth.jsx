import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sendWelcomeEmail } from '../lib/email';
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => _initialCachedProfile);
  const [ready, setReady] = useState(false);
  const [showBirthDataModal, setShowBirthDataModal] = useState(false);
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
          identifyUser(u.id, { email: u.email });
          if (hasCached) {
            markReady();
            loadProfile(u.id);
          } else {
            const profileData = await loadProfile(u.id);
            clearTimeout(authTimeout);
            clearTimeout(absoluteTimeout);
            markReady();
            // Detect newly verified user (came from email link, no birth data yet)
            // Show the birth data modal instead of redirecting to /birth-data page
            if (profileData && !profileData.birth_date && !profileData.birth_time) {
              setShowBirthDataModal(true);
            }
          }
        }
      } else {
        fetchIdRef.current++;
        setProfile(null);
        setCachedProfile(null);
        clearTimeout(authTimeout);
        clearTimeout(absoluteTimeout);
        markReady();
      }
    });

    return () => { clearTimeout(authTimeout); clearTimeout(absoluteTimeout); subscription.unsubscribe(); };
  }, [loadProfile]);

  const hasBirthData = !!(profile?.birth_date && profile?.birth_time && profile?.birth_lat != null && profile?.birth_lng != null);
  const isAdmin = profile?.is_admin === true;
  const isPremium = profile?.is_premium === true;
  const loading = !ready;

  function dismissBirthDataModal() {
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
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          updated_at: new Date().toISOString(),
        });
        // If auto-confirmed (session exists), load profile and show birth data modal
        if (data.session) {
          setUser(data.user);
          const profileData = await loadProfile(data.user.id);
          setCachedProfile(profileData);
          setReady(true);
          setShowBirthDataModal(true);
        }
        sendWelcomeEmail(data.user.email).catch(() => {});
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
        setUser(data.user);
        const profileData = await loadProfile(data.user.id);
        setCachedProfile(profileData);
        identifyUser(data.user.id, { email: data.user.email, is_premium: profileData?.is_premium });
        trackEvent('user_signed_in');
      }
      setReady(true);
      return data;
    } finally {
      signingInRef.current = false;
    }
  }

  async function signOut() {
    trackEvent('user_signed_out');
    resetUser();
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
    <AuthContext.Provider value={{ user, profile, loading, hasBirthData, isAdmin, isPremium, showBirthDataModal, dismissBirthDataModal, signUp, signIn, signOut, deleteAccount, updateDisplayName, resetPassword, saveBirthData, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
