import { createSupabaseServerClient } from '../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const supabase = await createSupabaseServerClient(event)
  const { data, error } = await supabase
    .from('audits')
    .select('id, name, slug, target_url, status, updated_at, summary')
    .order('updated_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { audits: data || [] }
})

