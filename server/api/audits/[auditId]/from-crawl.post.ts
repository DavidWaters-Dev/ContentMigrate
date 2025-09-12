import { createSupabaseServerClient } from '../../../utils/supabaseServer'
import { addUsage } from '../../../utils/usage'
import { crawlJobs } from '~/utils/crawl'

export default defineEventHandler(async (event) => {
  const { auditId } = getRouterParams(event)
  if (!auditId) throw createError({ statusCode: 400, statusMessage: 'auditId required' })
  const body = await readBody<{ crawlId: string }>(event)
  if (!body?.crawlId) throw createError({ statusCode: 400, statusMessage: 'crawlId required' })

  const job = crawlJobs.get(body.crawlId)
  if (!job) throw createError({ statusCode: 404, statusMessage: 'crawl not found' })
  if (job.status !== 'done') throw createError({ statusCode: 409, statusMessage: 'crawl not complete' })

  const pages = Array.from(job.fetched.keys()).map(url => ({ audit_id: auditId, url, status: 'crawled' }))
  // Enforce daily crawl pages cap when saving
  const DAILY_CRAWL_PAGES_LIMIT = 1000
  const usage = await addUsage(event, 'crawl_pages', 0, DAILY_CRAWL_PAGES_LIMIT, 'day')
  const remaining = usage?.remaining ?? 0
  const toSave = pages.slice(0, Math.max(0, remaining))
  const supabase = await createSupabaseServerClient(event)
  const { error } = await supabase
    .from('audit_pages')
    .upsert(toSave, { onConflict: 'audit_id,url' })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  // Increment usage by actual saved pages
  if (toSave.length > 0) await addUsage(event, 'crawl_pages', toSave.length, DAILY_CRAWL_PAGES_LIMIT, 'day')
  return { saved: toSave.length }
})
