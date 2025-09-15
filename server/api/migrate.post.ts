import { crawlJobs } from '~/utils/crawl'
import { pickContentBySelector, aiConvertToMarkdown, slugifyFromUrlOrTitle, toYAML } from '~/utils/migrate'
import type { MigrationOptions, MigrationResponse, MigrationPageResult } from '~/types/migrate'
import { addUsage } from '../utils/usage'
import { load as loadCheerio } from 'cheerio'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

function resolveTarget(root: string, p: string) {
  // If absolute path provided, respect it; otherwise join under root
  const normalized = path.normalize(p || '')
  if (path.isAbsolute(normalized)) return normalized
  const joined = path.join(root, normalized.replace(/^\/+/, ''))
  return joined
}

function extractPageMeta(html: string, url: string) {
  const $ = loadCheerio(html)
  const meta: any = { images: [], videoUrls: [] }
  // og:image, twitter:image
  const ogImg = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content')
  const twImg = $('meta[name="twitter:image"]').attr('content')
  if (ogImg) meta.featuredImage = new URL(ogImg, url).href
  if (twImg && !meta.featuredImage) meta.featuredImage = new URL(twImg, url).href
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src) meta.images.push(new URL(src, url).href)
  })
  // published date
  const artPub = $('meta[property="article:published_time"]').attr('content')
  if (artPub) meta.datePublished = artPub
  // JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text())
      const arr = Array.isArray(data) ? data : [data]
      for (const node of arr) {
        if (node?.datePublished && !meta.datePublished) meta.datePublished = node.datePublished
        if (node?.image) {
          const imgs = Array.isArray(node.image) ? node.image : [node.image]
          for (const i of imgs) if (typeof i === 'string') meta.images.push(new URL(i, url).href)
        }
        if (node?.embedUrl) meta.videoUrls.push(new URL(node.embedUrl, url).href)
      }
    } catch {}
  })
  // og:video, iframes
  const ogVid = $('meta[property="og:video"]').attr('content')
  if (ogVid) meta.videoUrls.push(new URL(ogVid, url).href)
  $('iframe[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src) meta.videoUrls.push(new URL(src, url).href)
  })
  meta.images = Array.from(new Set(meta.images))
  meta.videoUrls = Array.from(new Set(meta.videoUrls))
  return meta
}

function mergeFrontmatter(keys: string[], defaults: any, fromAi: any, meta: any, url: string) {
  const out: any = {}
  const take = (k: string, v: any) => { if (k && v != null && v !== '') out[k] = v }
  const dateNorm = (s?: string) => {
    if (!s) return undefined
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toISOString()
  }
  // Try to derive youtubeID from first video URL
  const yt = (meta?.videoUrls || []).find((u: string) => /youtube\.com|youtu\.be/.test(u || ''))
  const ytId = yt ? (yt.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1] || undefined) : undefined

  for (const k of keys) {
    const lk = k.toLowerCase()
    let v = fromAi[k]
    if (v == null) v = defaults[k]
    if ((v == null || v === '') && (lk === 'date' || lk === 'published' || lk === 'datepublished')) {
      v = dateNorm(meta?.datePublished)
    }
    if ((v == null || v === '') && (lk === 'image' || lk === 'mainimage' || lk === 'featuredimage')) {
      v = meta?.featuredImage || (Array.isArray(meta?.images) ? meta.images[0] : undefined)
    }
    if ((v == null || v === '') && (lk === 'youtubeid' || lk === 'youtube')) {
      v = ytId
    }
    take(k, v)
  }
  return out
}

async function downloadImageTo(url: string, absDir: string): Promise<{ absPath: string, publicPath: string } | null> {
  try {
    await fsp.mkdir(absDir, { recursive: true })
    const u = new URL(url)
    let name = path.basename(u.pathname) || 'image'
    if (!/\.[a-z0-9]{2,5}$/i.test(name)) name += '.jpg'
    const absPath = path.join(absDir, name)
    const res = await fetch(url, { headers: { 'User-Agent': 'ContentMigrator/1.0' } })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    await fsp.writeFile(absPath, buf)
    return { absPath, publicPath: name }
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ crawlId: string, includedUrls?: string[], options?: MigrationOptions, skipQuota?: boolean }>(event)
  const job = crawlJobs.get(body.crawlId)
  if (!job) throw createError({ statusCode: 404, statusMessage: 'crawl not found' })

  const logs: string[] = []
  const results: MigrationPageResult[] = []
  const csvRows: any[] = []

  const includeSet = new Set((body.includedUrls || []).filter(Boolean))
  const entries: Array<[string, string]> = []
  if (includeSet.size > 0) {
    for (const url of includeSet) {
      const cached = job.fetched.get(url)
      if (cached) { entries.push([url, cached]); continue }
      // Fetch fresh if not in cache
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ContentMigrator/1.0' } })
        clearTimeout(timeout)
        if (res.ok) {
          const html = await res.text()
          entries.push([url, html])
        } else {
          logs.push(`Fetch failed ${res.status} ${res.statusText} for ${url}`)
        }
      } catch (e: any) {
        logs.push(`Fetch error for ${url}: ${e?.message || e}`)
      }
    }
  } else {
    for (const entry of job.fetched) entries.push(entry)
  }

  const options: MigrationOptions = {
    frontmatter: body.options?.frontmatter || [],
    additionalPrompt: body.options?.additionalPrompt || '',
    selector: body.options?.selector || '',
    output: body.options?.output || { md: true, yml: true, json: true },
    slugStrategy: body.options?.slugStrategy || 'path',
    clientSave: Boolean((body as any)?.options?.clientSave)
  }

  // Enforce a daily pages migrated limit
  const DAILY_MIGRATION_LIMIT = 1000
  let remaining = Infinity
  if (!body.skipQuota) {
    try {
      const usage = await addUsage(event, 'pages_migrated', 0, DAILY_MIGRATION_LIMIT, 'day')
      remaining = usage?.remaining ?? 0
    } catch (e: any) {
      console.warn('[Migrate] Quota check skipped:', e?.message || e)
      remaining = Infinity
    }
  }

  logs.push(`Starting migration for ${entries.length} pages`)
  console.log(`[Migrate] Starting migration for`, entries.length, 'pages')

  // Default server-save paths (used only when clientSave is false)
  const baseRoot = path.join(os.homedir(), 'Downloads', process.env.MIGRATE_DOWNLOAD_SUBFOLDER || 'contentmigrate')
  const contentRoot = path.join(baseRoot, 'Content')
  const mediaRoot = path.join(baseRoot, 'media')
  if (!options.clientSave) {
    await fsp.mkdir(contentRoot, { recursive: true })
    await fsp.mkdir(mediaRoot, { recursive: true })
    logs.push(`Writing to ${contentRoot} and ${mediaRoot}`)
  } else {
    logs.push('Client-save mode: returning content + image URLs (no server writes)')
  }

  const pageConcurrency = Math.max(1, Math.min(4, Number(process.env.MIGRATION_PAGE_CONCURRENCY || 2)))
  for (let i = 0; i < entries.length; i += pageConcurrency) {
    const batch = entries.slice(i, i + pageConcurrency)
    await Promise.all(batch.map(async ([url, html]) => {
      const rlogs: string[] = []
      const start = Date.now()
      if (remaining <= 0) {
        results.push({ url, slug: '', imagesSaved: 0, status: 'error', error: 'Daily migration limit reached', logs: rlogs })
        return
      }
      try {
        rlogs.push(`Selecting content for ${url}`)
      const selectedHtml = pickContentBySelector(html, options.selector)
      const $ = loadCheerio(selectedHtml)
      const pageMeta = extractPageMeta(html, url)
        const htmlImages = $('img').map((_, el) => $(el).attr('src') || '').get().filter(Boolean)
        rlogs.push(`Found ${htmlImages.length} images in HTML`)

      const ai = await aiConvertToMarkdown(selectedHtml, url, options, pageMeta)
        const slug = ai.slug || slugifyFromUrlOrTitle(url, ai.frontmatter?.title)
        rlogs.push(`AI suggested slug: ${slug}`)
        // Merge image urls (from AI and HTML)
      const allImageUrls = Array.from(new Set([
        ...(ai.imageUrls || []),
        ...htmlImages,
        ...(pageMeta.images || []),
        pageMeta.featuredImage || ''
      ].filter(Boolean).map((u: string) => new URL(u, url).href)))

        // Prepare or download images
        let imagesSaved = 0
        const savedImages: Array<{ orig: string, file?: string, name: string, url: string }> = []
        if (options.clientSave) {
          for (const img of allImageUrls) {
            try {
              const u = new URL(img)
              let name = path.basename(u.pathname) || 'image.jpg'
              if (!/\.[a-z0-9]{2,5}$/i.test(name)) name += '.jpg'
              savedImages.push({ orig: img, name, url: new URL(img, url).href })
              imagesSaved++
            } catch {}
          }
          rlogs.push(`Prepared ${imagesSaved} images for client save`)
        } else {
          const pageMediaAbs = path.join(mediaRoot, slug)
          for (const img of allImageUrls) {
            const saved = await downloadImageTo(img, pageMediaAbs)
            if (saved) {
              imagesSaved++
              savedImages.push({ orig: img, file: saved.absPath, name: saved.publicPath, url: new URL(img, url).href })
            }
          }
          rlogs.push(`Saved ${imagesSaved} images to ${pageMediaAbs}`)
        }

        // Compose frontmatter
        const fmDefaults = Object.fromEntries((options.frontmatter || []).map(f => [f.key, f.default]))
        const fmFromAi = (ai.frontmatter || {}) as any
        const fmKeys = options.frontmatter?.map(f => f.key) || []
        const fm: any = mergeFrontmatter(fmKeys, fmDefaults, fmFromAi, pageMeta, url)

        // Write files
        await fsp.mkdir(contentRoot, { recursive: true })
        const mdPath = path.join(contentRoot, `${slug}.md`)
        const ymlPath = path.join(contentRoot, `${slug}.yml`)
        const jsonPath = path.join(contentRoot, `${slug}.json`)
        // Determine how to reference images in Markdown relative to Content/
        const replacements = new Map<string, string>()
        for (const si of savedImages) {
          const rel = `../media/${slug}/${si.name}`
          replacements.set(si.orig, rel)
        }

        // Rewrite markdown image links by a simple replacement of known URLs
        let md = ai.markdown
        for (const [orig, next] of replacements.entries()) {
          md = md.split(orig).join(next)
        }

        // If mainImage-like key exists and not set, set to first saved image
        const mainKey = Object.keys(fm).find(k => k.toLowerCase() === 'mainimage' || k.toLowerCase() === 'image' || k.toLowerCase() === 'featuredimage') || 'mainImage'
        if (!fm[mainKey] && savedImages.length) {
          const first = savedImages[0]
          const nextRef = replacements.get(first.orig)
          if (nextRef) fm[mainKey] = nextRef
        }

        if (options.output?.md !== false) {
          const yaml = toYAML(fm)
          const content = `---\n${yaml}\n---\n\n${md}`
          if (!options.clientSave) await fsp.writeFile(mdPath, content, 'utf8')
          else mdContent = content
        }
        if (options.output?.yml) {
          const yaml = toYAML(fm)
          if (!options.clientSave) await fsp.writeFile(ymlPath, `${yaml}\n`, 'utf8')
          else ymlContent = `${yaml}\n`
        }
        if (options.output?.json) {
          const payload = JSON.stringify({ frontmatter: fm, markdown: md, url }, null, 2)
          if (!options.clientSave) await fsp.writeFile(jsonPath, payload, 'utf8')
          else jsonContent = payload
        }

        // Increment usage per successful page
        if (!body.skipQuota) {
          try { await addUsage(event, 'pages_migrated', 1, DAILY_MIGRATION_LIMIT, 'day'); remaining-- } catch {}
        }

        const took = Date.now() - start
        rlogs.push(options.clientSave ? `Prepared files in ${took}ms` : `Wrote files in ${took}ms`)
        // Collect CSV row if requested
        if (options.output?.csv) {
          const row: any = { slug, url }
          for (const k of fmKeys) row[k] = fm[k] ?? ''
          csvRows.push(row)
        }
        results.push({
          url,
          slug,
          mdPath: options.clientSave ? undefined : mdPath,
          ymlPath: options.clientSave ? undefined : (options.output?.yml ? ymlPath : undefined),
          jsonPath: options.clientSave ? undefined : (options.output?.json ? jsonPath : undefined),
          imagesSaved,
          status: 'ok',
          logs: rlogs,
          ...(options.clientSave ? {
            mdContent,
            ymlContent,
            jsonContent,
            images: savedImages.map(si => ({ name: si.name, url: si.url }))
          } : {})
        } as any)
      } catch (e: any) {
        rlogs.push(`Error: ${e?.message || e}`)
        results.push({ url, slug: '', imagesSaved: 0, status: 'error', error: e?.message || String(e), logs: rlogs })
      }
    }))
  }

  const response: MigrationResponse = { results, logs }
  // Write CSV if requested
  try {
    const anyOk = results.some(r => r.status === 'ok')
    if (anyOk && (body.options?.output?.csv)) {
      const fmKeys = (body.options?.frontmatter || []).map((f: any) => f.key)
      const header = ['slug', 'url', ...fmKeys]
      const lines: string[] = []
      const esc = (v: string) => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
      lines.push(header.join(','))
      for (const r of csvRows) {
        const vals = header.map(h => String((r as any)[h] ?? '').replace(/\r?\n/g, ' ').trim())
        lines.push(vals.map(esc).join(','))
      }
      const csv = lines.join('\n')
      const baseRoot = path.join(os.homedir(), 'Downloads', process.env.MIGRATE_DOWNLOAD_SUBFOLDER || 'contentmigrate')
      const contentRoot = path.join(baseRoot, 'Content')
      await fsp.mkdir(contentRoot, { recursive: true })
      await fsp.writeFile(path.join(contentRoot, 'index.csv'), csv, 'utf8')
    }
  } catch (e) {
    console.warn('[Migrate] CSV write failed:', (e as any)?.message || e)
  }
  try {
    const ok = results.filter(r => r.status === 'ok').length
    const err = results.filter(r => r.status === 'error').length
    console.log(`[Migrate] Completed. ok=${ok}, error=${err}`)
  } catch {}
  return response
})
