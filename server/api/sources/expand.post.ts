export default defineEventHandler(async (event) => {
  const body = await readBody<{ origin?: string, patterns?: string[], excludes?: string[] }>(event)
  const origin = normalizeOrigin(body?.origin || '')
  if (!origin && !(body?.patterns && body.patterns.length)) {
    throw createError({ statusCode: 400, statusMessage: 'origin or patterns required' })
  }

  const includes = normalizePrefixes(body?.patterns || [], origin)
  const excludes = normalizePrefixes(body?.excludes || [], origin)
  const allowPath = (p: string) => {
    const lp = (p || '').toLowerCase()
    const incOk = includes.length ? includes.some(pre => matchPrefixAnchored(lp, pre)) : true
    const excOk = !excludes.some(pre => matchExclude(lp, pre))
    return incOk && excOk
  }

  // Build initial candidate list from sitemap if origin present
  let candidates: string[] = []
  if (origin) {
    const seeds = await fetchSitemap(origin)
    const rootHost = normalizeHost(new URL(origin).host)
    for (const u of seeds) {
      try {
        const url = new URL(u)
        if (normalizeHost(url.host) !== rootHost) continue
        if (!allowPath(url.pathname)) continue
        candidates.push(url.href)
      } catch {}
    }
  }

  // Add any absolute URLs from includes (host+path or full URL)
  for (const pre of includes) {
    try {
      if (origin) {
        candidates.push(new URL(pre, origin).href)
      }
    } catch {}
  }

  // Dedup and HEAD-validate (keep only text/html)
  const urls = Array.from(new Set(candidates))
  const validated: string[] = []
  const limit = 2000
  const headConcurrency = 8
  for (let i = 0; i < Math.min(urls.length, limit); i += headConcurrency) {
    const batch = urls.slice(i, i + headConcurrency)
    const results = await Promise.all(batch.map(async (u) => {
      try {
        const resp = await fetch(u, { method: 'HEAD' })
        const type = resp.headers.get('content-type') || ''
        if (!resp.ok) return null
        if (!type || type.includes('text/html') || type.startsWith('text/')) return u
        return null
      } catch { return null }
    }))
    for (const r of results) if (r) validated.push(r)
  }

  return { urls: validated }
})

function normalizeOrigin(o: string) {
  const s = String(o || '').trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    return u.origin
  } catch {
    try {
      const u = new URL('https://' + s)
      return u.origin
    } catch { return '' }
  }
}

function normalizePrefixes(arr?: string[], origin?: string) {
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of (arr || [])) {
    let s = String(v || '').trim()
    if (!s) continue
    try {
      if (/^https?:\/\//i.test(s)) {
        s = new URL(s, origin || undefined).pathname
      } else if (/^[\w.-]+\//.test(s)) {
        s = new URL('https://' + s).pathname
      }
    } catch {}
    s = s.split('#')[0].split('?')[0]
    s = s.replace(/\*$|\/\*$/g, '')
    s = s.startsWith('/') ? s : ('/' + s)
    s = s.replace(/\/+/g, '/').toLowerCase()
    if (s.length > 1) s = s.replace(/\/$/, '')
    if (s === '/tag') out.push('/tags')
    if (s === '/tags') out.push('/tag')
    if (s === '/category') out.push('/categories')
    if (s === '/categories') out.push('/category')
    if (!seen.has(s)) { seen.add(s); out.push(s) }
  }
  return out
}

function matchPrefixAnchored(pathLower: string, prefixLower: string) {
  if (prefixLower === '/') return true
  const p = pathLower.replace(/\/$/, '')
  const pre = prefixLower.replace(/\/$/, '')
  return p === pre || p.startsWith(pre + '/')
}

function matchExclude(pathLower: string, prefixLower: string) {
  const pre = prefixLower.replace(/\/$/, '')
  const seg = pre.startsWith('/') ? pre.slice(1) : pre
  if (!seg.includes('/')) {
    const parts = pathLower.replace(/\/$/, '').split('/').filter(Boolean)
    return parts.includes(seg)
  }
  return matchPrefixAnchored(pathLower, prefixLower)
}

async function fetchSitemap(origin: string) {
  const urls: string[] = []
  const seen = new Set<string>()
  const queue: string[] = ['/sitemap.xml', '/sitemap_index.xml']
  const max = 10
  while (queue.length && urls.length < 50000 && seen.size < max) {
    const path = queue.shift()!
    seen.add(path)
    try {
      const res = await fetch(new URL(path, origin))
      if (!res.ok) continue
      const text = await res.text()
      const locs = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
      for (const loc of locs) {
        if (/sitemap/i.test(loc)) {
          const u = new URL(loc)
          const p = u.pathname
          if (!seen.has(p)) queue.push(p)
        } else {
          urls.push(loc)
        }
      }
    } catch {}
  }
  return urls
}

function normalizeHost(host: string) {
  const h = String(host || '').toLowerCase()
  return h.startsWith('www.') ? h.slice(4) : h
}

