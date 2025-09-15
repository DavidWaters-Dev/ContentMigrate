import { startCrawl } from '~/utils/crawl'
import { addUsage } from '../utils/usage'
// Enforce crawl politeness and daily page caps to avoid misuse

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Daily per-user crawl page cap (adjust per plan later)
  const DAILY_CRAWL_PAGES_LIMIT = 1000
  const usage = await addUsage(event, 'crawl_pages', 0, DAILY_CRAWL_PAGES_LIMIT, 'day')
  const remainingPages = usage?.remaining ?? 0

  // No explicit max pages; rely on internal safety and quotas
  const maxPages = Math.max(0, remainingPages || 1000000)
  if (maxPages === 0) {
    throw createError({ statusCode: 429, statusMessage: 'Daily crawl pages limit reached' })
  }

  const MAX_CONCURRENCY = 2 // polite default for public internet
  const concurrency = Math.min(body.concurrency || 2, MAX_CONCURRENCY)
  const strategy = body.strategy || 'sitemap+internal'
  const respectRobots = body.respectRobots !== false
  const delayMs = 750
  const includePrefixes = Array.isArray(body.includePrefixes) ? body.includePrefixes : []
  const excludePrefixes = Array.isArray(body.excludePrefixes) ? body.excludePrefixes : []

  console.log(`[Crawl] Starting`, body.rootUrl, { maxPages, strategy, concurrency, respectRobots, delayMs, includePrefixes, excludePrefixes })
  const crawlId = await startCrawl(body.rootUrl, { maxPages, strategy, concurrency, respectRobots, delayMs, includePrefixes, excludePrefixes })
  console.log(`[Crawl] Started id=${crawlId}`)
  return { crawlId }
})
