import { createClient } from '@supabase/supabase-js'

let client = null

/**
 * Client Supabase unique, créé à la demande.
 * Ne doit être importé que depuis `src/admin/**` (jamais par les pages publiques).
 */
export function getSupabase() {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Configuration Supabase manquante : renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir .env.example).',
    )
  }
  client = createClient(url, anonKey)
  return client
}
