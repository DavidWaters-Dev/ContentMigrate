import { crawlJobs } from '~/utils/crawl'
import { extractPageFacts } from '~/utils/html'
import { analyzePage } from '~/utils/ai'
import { consolidateSite } from '~/utils/seo'
import { auditWithLighthouse } from '../utils/lighthouse'
import type { PageAudit } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ crawlId: string, includedUrls?: string[] }>(event)
  const job = crawlJobs.get(body.crawlId)
  if (!job) throw createError({ statusCode: 404, statusMessage: 'crawl not found' })

  const logs: string[] = []
  const pages: PageAudit[] = []

  // determine which URLs to analyze
  const includeSet = new Set((body.includedUrls || []).filter(Boolean))
  const entries: Array<[string, string]> = []
  if (includeSet.size > 0) {
    for (const [url, html] of job.fetched) {
      if (includeSet.has(url)) entries.push([url, html])
    }
  } else {
    for (const entry of job.fetched) entries.push(entry)
  }

  logs.push(`Starting analysis. Pages to analyze: ${entries.length}`)

  for (const [url, html] of entries) {
    const startedAt = Date.now()
    logs.push(`Analyzing: ${url}`)
    logs.push(`[AI] Requesting analysis for ${url}`)
    try {
      const facts = extractPageFacts(html, url)
      const audit = await analyzePage(facts)
      const lh = await auditWithLighthouse(url)
      audit.lighthouse = lh.scores
      audit.scores.performance = lh.scores.performance
      pages.push(audit)
      const ms = Date.now() - startedAt
      logs.push(`[AI] Received response for ${url} in ${ms}ms`)
      logs.push(`✔ Completed: ${url} (${ms} ms)`)      
    } catch (err: any) {
      const ms = Date.now() - startedAt
      logs.push(`✖ Error analyzing ${url} (${ms} ms): ${err?.message || String(err)}`)
    }
  }

  const site = consolidateSite(pages)
  logs.push('Analysis complete.')
  return { pages, site, logs }
})
