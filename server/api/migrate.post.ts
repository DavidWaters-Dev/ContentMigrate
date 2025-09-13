import { crawlJobs } from '~/utils/crawl'
import { pickContentBySelector, aiConvertToMarkdown, slugifyFromUrlOrTitle, toYAML } from '~/utils/migrate'
import type { MigrationOptions, MigrationResponse, MigrationPageResult } from '~/types/migrate'
import { addUsage } from '../utils/usage'
import cheerio from 'cheerio'
import { promises as fsp } from 'node:fs'
import path from 'node:path'

function safeJoin(root: string, p: string) {
  // Prevent path traversal and normalize
  const cleaned = (p || '').replace(/\\/g, '/').replace(/^\//, '').replace(/\.\.+/g, '.')
  return path.join(root, cleaned)
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

  const includeSet = new Set((body.includedUrls || []).filter(Boolean))
  const entries: Array<[string, string]> = []
  if (includeSet.size > 0) {
    for (const [url, html] of job.fetched) {
      if (includeSet.has(url)) entries.push([url, html])
    }
  } else {
    for (const entry of job.fetched) entries.push(entry)
  }

  const options: MigrationOptions = {
    contentDir: body.options?.contentDir || 'content/migrated',
    mediaDir: body.options?.mediaDir || 'public/images/migrated',
    frontmatter: body.options?.frontmatter || [],
    additionalPrompt: body.options?.additionalPrompt || '',
    selector: body.options?.selector || '',
    output: body.options?.output || { md: true, yml: true, json: true },
    slugStrategy: body.options?.slugStrategy || 'path'
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

  // Project root
  const root = process.cwd()
  // Resolve content/media absolute roots
  const contentRoot = safeJoin(root, options.contentDir)
  const mediaRoot = safeJoin(root, options.mediaDir)

  for (const [url, html] of entries) {
    const rlogs: string[] = []
    const start = Date.now()
    if (remaining <= 0) {
      results.push({ url, slug: '', imagesSaved: 0, status: 'error', error: 'Daily migration limit reached', logs: rlogs })
      continue
    }
    try {
      rlogs.push(`Selecting content for ${url}`)
      const selectedHtml = pickContentBySelector(html, options.selector)
      const $ = cheerio.load(selectedHtml)
      const htmlImages = $('img').map((_, el) => $(el).attr('src') || '').get().filter(Boolean)
      rlogs.push(`Found ${htmlImages.length} images in HTML`)

      const ai = await aiConvertToMarkdown(selectedHtml, url, options)
      const slug = ai.slug || slugifyFromUrlOrTitle(url, ai.frontmatter?.title)
      rlogs.push(`AI suggested slug: ${slug}`)
      // Merge image urls (from AI and HTML)
      const allImageUrls = Array.from(new Set([...(ai.imageUrls || []), ...htmlImages].map((u) => new URL(u, url).href)))

      // Create media directory for this page
      const pageMediaAbs = path.join(mediaRoot, slug)
      let imagesSaved = 0
      const savedImages: Array<{ orig: string, file: string }> = []
      for (const img of allImageUrls) {
        const saved = await downloadImageTo(img, pageMediaAbs)
        if (saved) {
          imagesSaved++
          savedImages.push({ orig: img, file: saved.absPath })
        }
      }
      rlogs.push(`Saved ${imagesSaved} images to ${pageMediaAbs}`)

      // Compose frontmatter
      const fmDefaults = Object.fromEntries((options.frontmatter || []).map(f => [f.key, f.default]))
      const fm: any = { ...fmDefaults, ...(ai.frontmatter || {}), sourceUrl: url }

      // Write files
      await fsp.mkdir(contentRoot, { recursive: true })
      const mdPath = path.join(contentRoot, `${slug}.md`)
      const ymlPath = path.join(contentRoot, `${slug}.yml`)
      const jsonPath = path.join(contentRoot, `${slug}.json`)
      // Determine how to reference images in Markdown
      const replacements = new Map<string, string>()
      for (const si of savedImages) {
        let ref: string
        const publicDir = safeJoin(root, 'public')
        if (si.file.startsWith(publicDir)) {
          const rel = path.relative(publicDir, si.file).replace(/\\/g, '/')
          ref = '/' + rel
        } else {
          const rel = path.relative(path.dirname(mdPath), si.file).replace(/\\/g, '/')
          ref = rel
        }
        replacements.set(si.orig, ref)
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
        await fsp.writeFile(mdPath, content, 'utf8')
      }
      if (options.output?.yml) {
        const yaml = toYAML(fm)
        await fsp.writeFile(ymlPath, `${yaml}\n`, 'utf8')
      }
      if (options.output?.json) {
        await fsp.writeFile(jsonPath, JSON.stringify({ frontmatter: fm, markdown: md, url }, null, 2), 'utf8')
      }

      // Increment usage per successful page
      if (!body.skipQuota) {
        try { await addUsage(event, 'pages_migrated', 1, DAILY_MIGRATION_LIMIT, 'day'); remaining-- } catch {}
      }

      const took = Date.now() - start
      rlogs.push(`Wrote files in ${took}ms`)
      results.push({ url, slug, mdPath, ymlPath: options.output?.yml ? ymlPath : undefined, jsonPath: options.output?.json ? jsonPath : undefined, imagesSaved, status: 'ok', logs: rlogs })
    } catch (e: any) {
      rlogs.push(`Error: ${e?.message || e}`)
      results.push({ url, slug: '', imagesSaved: 0, status: 'error', error: e?.message || String(e), logs: rlogs })
    }
  }

  const response: MigrationResponse = { results, logs }
  return response
})
