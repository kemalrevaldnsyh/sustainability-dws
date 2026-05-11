import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let _client = null;

/**
 * Shared browser client (singleton). Returns null if env is missing — app falls
 * back to demo login in main.js.
 */
export function getSupabase() {
  if (_client) return _client;
  if (!url || !anonKey) return null;
  _client = createClient(String(url).trim(), String(anonKey).trim(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

export function hasSupabaseConfig() {
  return !!(String(url || '').trim() && String(anonKey || '').trim());
}
