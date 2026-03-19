import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const fetchIdRef = useRef(0); // prevents stale profile fetches from overwriting
  const signingInRef = useRef(false); // tracks if signIn is in progress (ref to avoid stale closures)

  const loadProfile = useCallback(async (userId) => {
    const id = ++fetchIdRef.current;
    // Race the Supabase query against a 4-second timeout
    const result = await Promise.race([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      new Promise(resolve => setTimeout(() => resolve({ data: null, error: { message: 'Profile fetch timeout' } }), 4000)),
    ]);
    const { data, error } = result;
    if (error) console.error('[loadProfile]', error.message);
    if (id === fetchIdRef.current && data) {
      setProfile(data);
    }
    return data;
  }, []);

  useEffect(() => {
    // Safety net: force ready after 3 seconds no matter what
    const readyRef = { done: false };
    const markReady = () => {
      if (!readyRef.done) { readyRef.done = true; setReady(true); }
    };
    const authTimeout = setTimeout(markReady, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        if (!signingInRef.current) {
          await loadProfile(u.id);
          clearTimeout(authTimeout);
          markReady();
        }
      } else {
        fetchIdRef.current++;
        setProfile(null);
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
      // signInWithPassword triggers onAuthStateChange, but signingInRef prevents
      // the duplicate profile fetch. We load profile here so it's ready BEFORE
      // signIn returns → AuthRoute can redirect correctly.
      if (data?.user) {
        setUser(data.user);
        await loadProfile(data.user.id);
      }
      setReady(true);
      return data;
    } finally {
      signingInRef.current = false;
    }
  }

  async function signOut() {
    fetchIdRef.current++; // invalidate any in-flight fetches
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
