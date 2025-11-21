import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure auth options to use current origin in development
const authOptions = typeof window !== 'undefined' ? {
  redirectTo: window.location.origin,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
} : {};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
});
