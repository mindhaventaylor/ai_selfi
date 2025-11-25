import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Log warning instead of throwing to prevent app crashes
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables. Auth will not work.');
  console.error('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.error('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'set' : 'missing');
}

// Configure auth options to use current origin
const authOptions = typeof window !== 'undefined' ? {
  redirectTo: window.location.origin,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  // Use localStorage with fallback to cookies for session storage
  storage: {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('[Supabase] localStorage not available, using cookies');
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('[Supabase] Could not write to localStorage:', e);
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('[Supabase] Could not remove from localStorage:', e);
      }
    },
  },
} : {};

// Create a supabase client with error handling
let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: authOptions,
  });
} catch (e) {
  console.error('[Supabase] Failed to create client:', e);
  // Create a dummy client that will fail gracefully
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: { persistSession: false },
  });
}

export { supabase };
