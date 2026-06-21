import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://nodgmusskamkacofyvgz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZGdtdXNza2Fta2Fjb2Z5dmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTk3MDUsImV4cCI6MjA5NzM5NTcwNX0.iC277LL-yJypKIub7vm9KIrfaek5_i8bgRjHPNvbZBw'
);

export const ADMIN_TOKEN = 'FIT21ADMIN2026';
