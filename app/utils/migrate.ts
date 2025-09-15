import type { MigrationOptions } from '~/types/migrate'
import { load as loadCheerio } from 'cheerio'

const systemPrompt = `You are a precise content migration assistant.
Convert selected HTML into high-quality Markdown for a Nuxt Content site.
Rules:
- Use only the provided selected_content for the body_markdown.
- You MAY use page_meta (og tags, json-ld, dates, featured images, video urls) to populate frontmatter fields.
- Preserve headings hierarchy (h1..h3), lists, links, and quotes.
- Convert tables into Markdown tables when feasible.
- Do NOT include any CSS or inline styles.
- Extract and fill only the requested frontmatter keys when possible.
- Include a concise, meaningful title if requested.
- Return only JSON with: { frontmatter: object, body_markdown: string, suggested_slug: string, image_urls: string[] }.
- body_markdown must NOT include frontmatter fences.`

export async function aiConvertToMarkdown(html: string, url: string, options: MigrationOptions, pageMeta?: any) {
  const config = useRuntimeConfig()
  if (!config.openaiApiKey) throw new Error('Missing OPENAI_API_KEY')

  const fmKeys = options.frontmatter?.map(f => f.key) || []
  const userPrompt = [
    options.additionalPrompt ? `Extra context: ${options.additionalPrompt}` : '',
    fmKeys.length ? `Frontmatter keys to fill: ${fmKeys.join(', ')}` : '',
    `Origin URL: ${url}`,
  ].filter(Boolean).join('\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify({ url, selected_content: html, page_meta: pageMeta || {}, frontmatter: fmKeys, prompt: options.additionalPrompt || '' }) }
      ]
    })
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || 'OpenAI error')
  }

  let parsed: any
  try {
    const content = data?.choices?.[0]?.message?.content
    parsed = typeof content === 'string' ? JSON.parse(content) : content
  } catch (e) {
    parsed = { frontmatter: {}, body_markdown: '', suggested_slug: '', image_urls: [] }
  }

  const fm = typeof parsed?.frontmatter === 'object' && parsed.frontmatter ? parsed.frontmatter : {}
  const md = String(parsed?.body_markdown || '')
  const slug = String(parsed?.suggested_slug || '') || slugifyFromUrlOrTitle(url, fm.title)
  const imageUrls: string[] = Array.isArray(parsed?.image_urls) ? parsed.image_urls.filter(Boolean) : []
  return { frontmatter: fm, markdown: md, slug, imageUrls }
}

export function pickContentBySelector(html: string, selector?: string) {
  if (!selector) return html
  try {
    const $ = loadCheerio(html)
    const el = $(selector)
    if (!el.length) return html
    return el.first().html() || html
  } catch {
    return html
  }
}

export function slugifyFromUrlOrTitle(url: string, title?: string) {
  if (title) return slugify(title, 80)
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/$/, '')
    const last = path.split('/').filter(Boolean).pop() || u.host
    return slugify(last, 80)
  } catch {
    return slugify(title || url, 80)
  }
}

export function toYAML(obj: Record<string, any>, indent = ''): string {
  // Minimal YAML serializer for scalars, arrays, simple objects
  const lines: string[] = []
  const isPlainObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v)
  const esc = (s: string) => {
    if (s === '' || /[:#\-\n\r\t]/.test(s)) return JSON.stringify(s)
    return s
  }
  for (const [k, v] of Object.entries(obj || {})) {
    if (Array.isArray(v)) {
      lines.push(`${indent}${k}:`)
      for (const item of v) {
        if (isPlainObject(item)) {
          lines.push(`${indent}  -`)
          lines.push(toYAML(item, indent + '    '))
        } else {
          lines.push(`${indent}  - ${esc(String(item))}`)
        }
      }
    } else if (isPlainObject(v)) {
      lines.push(`${indent}${k}:`)
      lines.push(toYAML(v, indent + '  '))
    } else if (typeof v === 'boolean' || typeof v === 'number') {
      lines.push(`${indent}${k}: ${String(v)}`)
    } else if (v == null) {
      lines.push(`${indent}${k}:`)
    } else {
      lines.push(`${indent}${k}: ${esc(String(v))}`)
    }
  }
  return lines.join('\n')
}

function slugify(input: string, max = 64) {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max) || 'content'
}
