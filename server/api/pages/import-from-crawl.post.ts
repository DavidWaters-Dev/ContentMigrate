import { crawlJobs } from '~/utils/crawl'
import { createSupabaseServerClient } from '~~/server/utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ crawlId: string, rootUrl?: string, strategy?: string, includePrefixes?: string[], excludePrefixes?: string[] }>(event)
  if (!body?.crawlId) throw createError({ statusCode: 400, statusMessage: 'crawlId required' })
  const job = crawlJobs.get(body.crawlId)
  if (!job) throw createError({ statusCode: 404, statusMessage: 'crawl not found' })
  const supabase = await createSupabaseServerClient(event)

  const { data: crawlRow, error: crawlErr } = await supabase
    .from('content_crawls')
    .insert({ root_url: body.rootUrl || '', strategy: body.strategy || 'sitemap+internal', include_prefixes: body.includePrefixes || [], exclude_prefixes: body.excludePrefixes || [] })
    .select('id')
    .single()
  if (crawlErr) throw createError({ statusCode: 500, statusMessage: crawlErr.message })
  const crawlId = crawlRow.id

  const urls = Array.from(job.fetched.keys())
  const rows = urls.map(u => ({ crawl_id: crawlId, url: u }))
  const batchSize = 500
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize)
    const { error } = await supabase.from('content_pages').upsert(chunk, { onConflict: 'user_key,url' })
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { inserted: rows.length, crawlId }
})

