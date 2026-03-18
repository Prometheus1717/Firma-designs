import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbwjxtvqdkcicaydtixp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p4dHZxZGtjaWNheWR0aXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTI2MzgsImV4cCI6MjA4OTM2ODYzOH0.wSCQggZvla81LadS1E50rW3eRlSJNPRCdMruhBXsM10';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
