import { createSupabaseServerClient } from '../../utils/supabaseServer'
import { addUsage } from '../../utils/usage'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ auditId: string, pageIds: string[], priority?: number, type?: 'page_analysis'|'site_consolidation' }>(event)
  if (!body?.auditId || !Array.isArray(body.pageIds)) {
    throw createError({ statusCode: 400, statusMessage: 'auditId and pageIds are required' })
  }
  const supabase = await createSupabaseServerClient(event)

  // Pre-charge AI tokens usage to prevent abuse
  // TODO: derive per-plan limits and per-page estimate dynamically
  const TOKENS_PER_PAGE_ESTIMATE = 1500
  const DAILY_TOKENS_LIMIT = 100000
  const estimate = Math.max(0, (body.pageIds?.length || 0) * TOKENS_PER_PAGE_ESTIMATE)
  if (estimate > 0) {
    const usage = await addUsage(event, 'ai_tokens', estimate, DAILY_TOKENS_LIMIT, 'day')
    if (!usage.allowed) {
      throw createError({ statusCode: 429, statusMessage: 'AI tokens daily limit reached' })
    }
  }

  const rows = body.pageIds.map(id => ({
    audit_id: body.auditId,
    page_id: id,
    type: body.type || 'page_analysis',
    priority: body.priority ?? 100,
    status: 'queued'
  }))

  const { data, error } = await supabase
    .from('analysis_jobs')
    .insert(rows)
    .select('id')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { enqueued: data?.length || 0 }
})
