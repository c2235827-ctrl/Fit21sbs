import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nodgmusskamkacofyvgz.supabase.co';
// @ts-ignore
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZGdtdXNza2Fta2Fjb2Z5dmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTk3MDUsImV4cCI6MjA5NzM5NTcwNX0.iC277LL-yJypKIub7vm9KIrfaek5_i8bgRjHPNvbZBw';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
