import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

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
    // The profile will be refreshed in the background
    const hasCached = !!_initialCachedProfile;
    const authTimeout = setTimeout(markReady, hasCached ? 0 : 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        if (!signingInRef.current) {
          // If we had a cached profile, we're already "ready" — refresh in background
          if (hasCached) {
            markReady();
            loadProfile(u.id); // fire-and-forget background refresh
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        updated_at: new Date().toISOString(),
      });
    }
    return data;
  }

  async function signIn(email, password) {
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

  async function resetPassword(email) {
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
    <AuthContext.Provider value={{ user, profile, loading, hasBirthData, isAdmin, signUp, signIn, signOut, resetPassword, saveBirthData, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
