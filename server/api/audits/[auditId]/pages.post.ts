import { createSupabaseServerClient } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const { auditId } = getRouterParams(event)
  if (!auditId) throw createError({ statusCode: 400, statusMessage: 'auditId required' })
  const body = await readBody<{ pages: Array<{ url: string, score?: number, status?: string, details?: any }> }>(event)
  if (!Array.isArray(body?.pages) || body.pages.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'pages array required' })
  }

  const supabase = await createSupabaseServerClient(event)
  const rows = body.pages.map(p => ({
    audit_id: auditId,
    url: p.url,
    score: p.score ?? null,
    status: (p.status as any) ?? 'crawled',
    details: p.details ?? {}
  }))
  const { data, error } = await supabase
    .from('audit_pages')
    .upsert(rows, { onConflict: 'audit_id,url' })
    .select('id, url, status, score')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { count: data?.length || 0 }
})
