import { createSupabaseServerClient } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const { auditId } = getRouterParams(event)
  if (!auditId) throw createError({ statusCode: 400, statusMessage: 'auditId required' })
  const supabase = await createSupabaseServerClient(event)
  const { data, error } = await supabase
    .from('audit_pages')
    .select('id, url, status, score, details')
    .eq('audit_id', auditId)
    .order('url', { ascending: true })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { pages: data || [] }
})

