export type PageFacts = {
  url: string
  title?: string
  metaDescription?: string
  robotsMeta?: string
  canonical?: string
  hreflang?: string[]
  headings: { h1?: string; h2: string[]; h3: string[] }
  og: { hasOg: boolean; hasTwitter: boolean }
  links: { internal: string[]; external: string[] }
  images: Array<{ src: string; alt?: string }>
  jsonld: any[]
  wordCount: number
  perf: { bytes: number; scripts: number }
}

export type Issue = {
  id: string
  category: 'on-page' | 'technical' | 'content' | 'ai-readiness' | 'performance'
  severity: 'critical' | 'high' | 'medium' | 'low'
  summary: string
  rationale: string
  fixSteps: string[]
  snippet?: { type: 'meta' | 'html' | 'jsonld' | 'robots'; code: string }
  pagesAffected?: string[]
}

export type PageAudit = {
  url: string
  scores: { onPage: number; technical: number; content: number; aiReadiness: number; performance: number }
  lighthouse?: { performance: number; seo: number; accessibility: number; bestPractices: number }
  issues: Issue[]
  quickWins: string[]
}

export type SiteSummary = {
  healthScore: number
  categoryScores: { onPage: number; technical: number; content: number; aiReadiness: number; performance: number }
  consolidatedIssues: Issue[]
  totals: { pages: number; critical: number; high: number; medium: number; low: number }
  lighthouseAverage?: { performance: number; seo: number; accessibility: number; bestPractices: number }
}
