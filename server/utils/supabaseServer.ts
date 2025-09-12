import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// Creates a Supabase client bound to the current H3 event, passing a Kinde-signed
// Authorization header so RLS can identify the user from JWT claims (sub).
export async function createSupabaseServerClient(event: any) {
  // Prefer reading the Kinde ID token from cookie; adjust if your Kinde SDK exposes a server getter.
  // Preferred: ask the Kinde Nuxt server middleware for the ID token
  let idToken: string | undefined
  try {
    const kinde = event?.context?.kinde
    if (kinde?.getToken) {
      idToken = await kinde.getToken('id_token')
      if (!idToken) {
        // Fallback to access token if id_token unavailable
        idToken = await kinde.getToken('access_token')
      }
    }
  } catch (e) {
    console.warn('[Supabase] Kinde getToken failed:', (e as any)?.message || e)
  }
  // As a last resort, check a direct cookie some setups use
  if (!idToken) {
    idToken = getCookie(event, 'kinde_id_token') as string | undefined
  }

  // Sign the Kinde ID token with the same secret configured as Supabase JWT Secret.
  // Fallback to anon key when unauthenticated.
  // If we have a Kinde ID token, decode its claims and re-sign them with a shared
  // secret (must match Supabase Auth JWT Secret). This exposes claims like `sub`
  // to RLS via request.jwt.claims.
  let token: string
  if (idToken) {
    const claims = jwt.decode(idToken)
    if (claims && typeof claims === 'object') {
      // Log only non-sensitive identifiers
      console.log('[Supabase] Using Kinde ID token; sub:', (claims as any).sub)
      token = jwt.sign(claims, process.env.NUXT_KINDE_CLIENT_SECRET as string)
    } else {
      console.warn('[Supabase] Failed to decode Kinde ID token; falling back to anon context')
      // Fallback to anon if decode fails
      token = process.env.SUPABASE_KEY as string
    }
  } else {
    // Using anon context (no Kinde token available on this request)
    token = process.env.SUPABASE_KEY as string
  }

  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_KEY as string,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )
}
