import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbwjxtvqdkcicaydtixp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p4dHZxZGtjaWNheWR0aXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMzQ5MTgsImV4cCI6MjA1NzkxMDkxOH0.sb_publishable_coJ4vFFulvK0pWqShA2VDA_mSlk3YcP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
