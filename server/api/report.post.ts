import type { SiteSummary, PageAudit } from '~/types'

function toMarkdown (site: SiteSummary, pages: PageAudit[]) {
  let md = `# SEO Audit Report\n\nHealth Score: ${site.healthScore}\n\n`
  md += '| Category | Score |\n|---|---|\n'
  Object.entries(site.categoryScores).forEach(([k, v]) => {
    md += `| ${k} | ${v} |\n`
  })
  md += '\n## Top Issues\n'
  site.consolidatedIssues.slice(0, 10).forEach((i, idx) => {
    md += `\n### ${idx + 1}. ${i.summary}\nSeverity: ${i.severity}\n\n`
    i.fixSteps.forEach(step => { md += `- ${step}\n` })
    if (i.snippet) {
      md += `\n${i.snippet.code}\n`
    }
  })
  return md
}

function toCsv (site: SiteSummary) {
  const rows: string[] = ['severity,category,issue,affected_url,snippet_type,snippet_code']
  site.consolidatedIssues.forEach(i => {
    const urls = i.pagesAffected || ['']
    urls.forEach(u => {
      rows.push([i.severity, i.category, i.summary.replace(/,/g, ' '), u, i.snippet?.type || '', (i.snippet?.code || '').replace(/\n/g, '')].join(','))
    })
  })
  return rows.join('\n')
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ site: SiteSummary; pages: PageAudit[]; format: 'markdown' | 'csv' }>(event)
  if (body.format === 'csv') {
    return { filename: 'seo-audit.csv', content: toCsv(body.site) }
  }
  return { filename: 'seo-audit.md', content: toMarkdown(body.site, body.pages) }
})

