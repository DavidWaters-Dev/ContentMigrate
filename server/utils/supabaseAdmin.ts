import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL as string
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY) as string
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[SupabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key; RLS may block worker operations.')
  }
  return createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${key}` }
    }
  })
}

