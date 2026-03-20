import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbwjxtvqdkcicaydtixp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p4dHZxZGtjaWNheWR0aXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTI2MzgsImV4cCI6MjA4OTM2ODYzOH0.wSCQggZvla81LadS1E50rW3eRlSJNPRCdMruhBXsM10';

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
  // Realtime disabled — we don't need it, saves WebSocket connections at scale
  realtime: {
    params: { eventsPerSecond: 0 },
  },
});
