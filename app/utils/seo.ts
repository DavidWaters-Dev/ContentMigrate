import type { PageAudit, SiteSummary, Issue } from '~/types'

export function consolidateSite (pages: PageAudit[]): SiteSummary {
  const categoryTotals = { onPage: 0, technical: 0, content: 0, aiReadiness: 0, performance: 0 }
  const lighthouseTotals = { performance: 0, seo: 0, accessibility: 0, bestPractices: 0 }
  const issueMap = new Map<string, Issue>()
  const totals = { pages: pages.length, critical: 0, high: 0, medium: 0, low: 0 }

  pages.forEach(p => {
    categoryTotals.onPage += p.scores.onPage
    categoryTotals.technical += p.scores.technical
    categoryTotals.content += p.scores.content
    categoryTotals.aiReadiness += p.scores.aiReadiness
    categoryTotals.performance += p.scores.performance
    if (p.lighthouse) {
      lighthouseTotals.performance += p.lighthouse.performance
      lighthouseTotals.seo += p.lighthouse.seo
      lighthouseTotals.accessibility += p.lighthouse.accessibility
      lighthouseTotals.bestPractices += p.lighthouse.bestPractices
    }
    p.issues.forEach(i => {
      const sev = (['critical','high','medium','low'] as const).includes(i.severity as any) ? i.severity : 'medium'
      totals[sev]++
      const key = i.id || `${i.category}:${i.summary}`.toLowerCase()
      if (!issueMap.has(key)) {
        issueMap.set(key, { ...i, severity: sev, pagesAffected: [p.url] })
      } else {
        issueMap.get(key)!.pagesAffected!.push(p.url)
      }
    })
  })

  const categoryScores = {
    onPage: Math.round(categoryTotals.onPage / pages.length || 0),
    technical: Math.round(categoryTotals.technical / pages.length || 0),
    content: Math.round(categoryTotals.content / pages.length || 0),
    aiReadiness: Math.round(categoryTotals.aiReadiness / pages.length || 0),
    performance: Math.round(categoryTotals.performance / pages.length || 0)
  }
  const lighthouseAverage = {
    performance: Math.round(lighthouseTotals.performance / pages.length || 0),
    seo: Math.round(lighthouseTotals.seo / pages.length || 0),
    accessibility: Math.round(lighthouseTotals.accessibility / pages.length || 0),
    bestPractices: Math.round(lighthouseTotals.bestPractices / pages.length || 0)
  }
  const healthScore = Math.round(Object.values(categoryScores).reduce((a, b) => a + b, 0) / 5)
  return {
    healthScore,
    categoryScores,
    consolidatedIssues: Array.from(issueMap.values()),
    totals,
    lighthouseAverage
  }
}
