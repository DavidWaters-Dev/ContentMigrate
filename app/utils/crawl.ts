import { randomUUID } from 'node:crypto'

export type CrawlJob = {
  id: string
  status: 'running' | 'done' | 'error'
  discovered: Set<string>
  fetched: Map<string, string>
  logs: string[]
  error?: string
}

export const crawlJobs = new Map<string, CrawlJob>()

export async function startCrawl (rootUrl: string, opts: { maxPages: number; strategy: 'sitemap-only' | 'sitemap+internal'; concurrency: number; respectRobots?: boolean; delayMs?: number }) {
  const id = randomUUID()
  const job: CrawlJob = {
    id,
    status: 'running',
    discovered: new Set(),
    fetched: new Map(),
    logs: []
  }
  crawlJobs.set(id, job)
  crawlSite(rootUrl, opts, job).then(() => {
    job.status = 'done'
    job.logs.push(`[Crawl] Done. Pages fetched: ${job.fetched.size}`)
  }).catch((e: any) => {
    job.status = 'error'
    job.error = e.message
    job.logs.push(`[Crawl] Error: ${e.message}`)
  })
  return id
}

async function crawlSite (rootUrl: string, opts: { maxPages: number; strategy: 'sitemap-only' | 'sitemap+internal'; concurrency: number; respectRobots?: boolean; delayMs?: number }, job: CrawlJob) {
  const origin = new URL(rootUrl).origin
  job.logs.push(`[Crawl] Starting at ${rootUrl} (origin ${origin}) with opts ${JSON.stringify(opts)}`)
  const robots = opts.respectRobots === false ? (() => true) : await fetchRobots(origin)
  const perHostLastRequest = new Map<string, number>()
  const minDelay = Math.max(0, opts.delayMs ?? 0)
  let seeds: string[] = []
  if (opts.strategy === 'sitemap-only' || opts.strategy === 'sitemap+internal') {
    seeds = await fetchSitemap(origin)
    job.logs.push(`[Crawl] Sitemap seeds: ${seeds.length}`)
  }
  if (seeds.length === 0) seeds = [rootUrl]
  const queue: string[] = [...seeds]
  while (queue.length && job.fetched.size < opts.maxPages) {
    const urls = queue.splice(0, opts.concurrency)
    await Promise.all(urls.map(async (url) => {
      if (job.discovered.has(url)) return
      if (!robots(url)) {
        job.logs.push(`[Crawl] Blocked by robots: ${url}`)
        return
      }
      job.discovered.add(url)
      try {
        // Polite per-host delay
        const host = new URL(url).host
        const last = perHostLastRequest.get(host) || 0
        const wait = Math.max(0, last + minDelay - Date.now())
        if (wait > 0) await new Promise(r => setTimeout(r, wait))
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        const res = await fetch(url, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'AI-SEO-Auditor/0.1 (+https://localhost)' }
        })
        clearTimeout(timeout)
        perHostLastRequest.set(host, Date.now())
        if (!res.ok) {
          job.logs.push(`[Crawl] HTTP ${res.status} ${res.statusText}: ${url}`)
          return
        }
        const html = await res.text()
        job.fetched.set(url, html)
        job.logs.push(`[Crawl] Fetched: ${url} (len ${html.length})`)
        if (opts.strategy === 'sitemap+internal') {
          const links = extractLinks(html, url)
          job.logs.push(`[Crawl] Extracted ${links.length} links from ${url}`)
          for (const l of links) {
            const u = new URL(l, origin).href
            if (u.startsWith(origin) && !job.discovered.has(u) && job.fetched.size + queue.length < opts.maxPages) {
              queue.push(u)
            }
          }
        }
      } catch (e: any) {
        job.logs.push(`[Crawl] Error fetching ${url}: ${e?.message || String(e)}`)
      }
    }))
  }
}

async function fetchRobots (origin: string) {
  try {
    const res = await fetch(new URL('/robots.txt', origin))
    if (!res.ok) return () => true
    const text = await res.text()

    // Parse only the rules under User-agent: *
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    let active = false
    const allows: string[] = []
    const disallows: string[] = []

    for (const line of lines) {
      const lower = line.toLowerCase()
      if (lower.startsWith('user-agent:')) {
        const ua = line.split(':')[1]?.trim().toLowerCase() || ''
        active = ua === '*' // treat our crawler as generic
        continue
      }
      if (!active) continue
      if (lower.startsWith('allow:')) {
        const val = line.split(':')[1]?.trim() || ''
        if (val) allows.push(val)
        continue
      }
      if (lower.startsWith('disallow:')) {
        const val = line.split(':')[1]?.trim() || ''
        // Important: empty Disallow means allow all, so skip
        if (val) disallows.push(val)
        continue
      }
      // stop at next user-agent block
      if (lower.startsWith('sitemap:')) continue
    }

    // Build matcher: Allow takes precedence over Disallow by prefix
    return (url: string) => {
      const path = new URL(url).pathname
      if (allows.some(a => path.startsWith(a))) return true
      if (disallows.some(d => path.startsWith(d))) return false
      return true
    }
  } catch {
    return () => true
  }
}

async function fetchSitemap (origin: string) {
  const urls: string[] = []
  for (const path of ['/sitemap.xml', '/sitemap_index.xml']) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(new URL(path, origin), { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) continue
      const text = await res.text()
      const locs = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
      urls.push(...locs)
      if (urls.length) break
    } catch {}
  }
  return urls
}

function extractLinks (html: string, base: string) {
  const links: string[] = []
  const regex = /<a [^>]*href=['"]([^'"]+)['"][^>]*>/gi
  let m
  while ((m = regex.exec(html))) {
    const href = m[1]
    if (href.startsWith('javascript:')) continue
    links.push(new URL(href, base).href)
  }
  return links
}
