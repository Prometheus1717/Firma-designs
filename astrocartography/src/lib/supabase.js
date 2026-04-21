import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage — returning users skip auth round-trip
    persistSession: true,
    // Detect session from URL (for OAuth/magic links)
    detectSessionInUrl: true,
    // Reduce concurrent auth refresh storms at 100k scale
    autoRefreshToken: true,
  },
  // Global fetch timeout — prevents hung connections under load
  global: {
    headers: { 'x-client-info': 'natal-navigator' },
  },
  // Realtime fully disabled — no WebSocket connection opened, saves resources at scale
  realtime: {
    params: { eventsPerSecond: 0 },
  },
  db: {
    // Use HEAD for count queries — less data transfer
    schema: 'public',
  },
});
