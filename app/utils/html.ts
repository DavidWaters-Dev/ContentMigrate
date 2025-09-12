import { load } from 'cheerio'
import type { PageFacts } from '~/types'

export function extractPageFacts (html: string, url: string): PageFacts {
  const $ = load(html)
  const facts: PageFacts = {
    url,
    title: $('title').text() || undefined,
    metaDescription: $('meta[name="description"]').attr('content'),
    robotsMeta: $('meta[name="robots"]').attr('content'),
    canonical: $('link[rel="canonical"]').attr('href'),
    hreflang: $('link[rel="alternate"][hreflang]').map((_, el) => $(el).attr('hreflang') || '').get(),
    headings: {
      h1: $('h1').first().text() || undefined,
      h2: $('h2').map((_, el) => $(el).text()).get(),
      h3: $('h3').map((_, el) => $(el).text()).get()
    },
    og: {
      hasOg: $('meta[property^="og:"]').length > 0,
      hasTwitter: $('meta[name^="twitter:"]').length > 0
    },
    links: { internal: [], external: [] },
    images: [],
    jsonld: [],
    wordCount: $('body').text().trim().split(/\s+/).length,
    perf: { bytes: Buffer.byteLength(html), scripts: $('script').length }
  }

  $('a[href]').each((_, el) => {
    if ($(el).attr('rel')?.includes('nofollow')) return
    const href = $(el).attr('href') || ''
    const link = new URL(href, url)
    if (link.origin === new URL(url).origin) facts.links.internal.push(link.href)
    else facts.links.external.push(link.href)
  })

  $('img').each((_, el) => {
    const src = $(el).attr('src') || ''
    facts.images.push({ src: new URL(src, url).href, alt: $(el).attr('alt') || undefined })
  })

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      facts.jsonld.push(JSON.parse($(el).contents().text()))
    } catch {}
  })

  return facts
}
