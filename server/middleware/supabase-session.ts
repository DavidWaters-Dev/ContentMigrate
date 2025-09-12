import { defineEventHandler, getRequestURL } from 'h3'
import { createSupabaseServerClient } from '../utils/supabaseServer'

const hasEnv = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_KEY &&
  process.env.NUXT_KINDE_CLIENT_SECRET
)

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!hasEnv) return
  if (url.pathname.startsWith('/_nuxt') || url.pathname.startsWith('/public')) return

  // Only sync session when the user is authenticated with Kinde
  try {
    const isAuthed = await (event as any)?.context?.kinde?.isAuthenticated?.()
    if (!isAuthed) return
  } catch {
    // If Kinde context isn’t ready, skip quietly
    return
  }

  const supabase = await createSupabaseServerClient(event)
  try {
    // Important: do not insert other logic between client creation and getUser()
    await supabase.auth.getUser()
  } catch {
    // Avoid noisy errors; cookie sync can still proceed on next request
  }
})
