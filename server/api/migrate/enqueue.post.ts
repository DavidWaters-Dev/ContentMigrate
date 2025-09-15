import { addUsage } from '../../utils/usage'
import { createSupabaseServerClient } from '~~/server/utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ crawlId: string, includedUrls?: string[], options?: any }>(event)
  if (!body?.crawlId) throw createError({ statusCode: 400, statusMessage: 'crawlId required' })
  // Reserve quota if available
  const DAILY_MIGRATION_LIMIT = 1000
  let included = (body.includedUrls || []).filter(Boolean)
  try {
    const usage = await addUsage(event, 'pages_migrated', 0, DAILY_MIGRATION_LIMIT, 'day')
    const remaining = usage?.remaining ?? 0
    if (remaining <= 0) throw createError({ statusCode: 429, statusMessage: 'Daily migration limit reached' })
    if (included.length > remaining) included = included.slice(0, remaining)
    // Reserve now to avoid double counting when worker runs with skipQuota
    if (included.length > 0) await addUsage(event, 'pages_migrated', included.length, DAILY_MIGRATION_LIMIT, 'day')
  } catch (e: any) {
    // If Supabase/quotas aren’t configured, proceed without reservation
    console.warn('[Enqueue] Quota reservation skipped:', e?.message || e)
  }
  // Enqueue job in Supabase
  try {
    const supabase = await createSupabaseServerClient(event)
    const { data: jobId, error } = await supabase.rpc('fn_migration_jobs_enqueue', {
      p_payload: { crawlId: body.crawlId, includedUrls: included, options: body.options },
      p_priority: 100
    })
    if (error) throw error
    return { jobId, plannedPages: included.length }
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e?.message || 'Failed to enqueue job' })
  }
})
