import { createSupabaseServerClient } from '~~/server/utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ urls: string[] }>(event)
  if (!Array.isArray(body?.urls) || body.urls.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'urls[] required' })
  }
  const supabase = await createSupabaseServerClient(event)
  const { error } = await supabase.rpc('fn_pages_mark_migrated', { p_urls: body.urls })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { updated: body.urls.length }
})

