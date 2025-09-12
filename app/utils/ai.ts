import type { PageFacts, PageAudit, Issue } from '~/types'

const systemPrompt = `You are an SEO & content quality analyst.
Use modern guidance (Core Web Vitals with INP; helpful, people-first content with E-E-A-T; AI-search readiness).
Return only valid JSON with:
  scores: { onPage:number, technical:number, content:number, aiReadiness:number, performance:number } (0-100 ints),
  issues: [
    { id:string, category:'on-page'|'technical'|'content'|'ai-readiness'|'performance', severity:'critical'|'high'|'medium'|'low', summary:string, rationale:string, fixSteps:string[], snippet?:{ type:'meta'|'html'|'jsonld'|'robots', code:string } }
  ],
  quickWins: string[]
Derive a stable id as a lowercase slug of "<category>: <summary>".`

export async function analyzePage (facts: PageFacts): Promise<PageAudit> {
  const config = useRuntimeConfig()
  if (!config.openaiApiKey) {
    throw new Error('Missing OpenAI API key')
  }

  const startedAt = Date.now()
  // Server-side log for visibility
  console.log(`[AI] Requesting analysis for`, facts.url)

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
        { role: 'user', content: JSON.stringify({ url: facts.url, facts }) }
      ]
    })
  })

  const data = await res.json()
  if (!res.ok) {
    console.error(`[AI] Error for ${facts.url}:`, data)
    throw new Error(data.error?.message || 'Failed to fetch analysis')
  }
  console.log(`[AI] Received response for ${facts.url} in ${Date.now() - startedAt}ms`)

  let raw: any
  try {
    const content = data?.choices?.[0]?.message?.content
    raw = typeof content === 'string' ? JSON.parse(content) : content
  } catch (e) {
    console.warn(`[AI] JSON parse failed for ${facts.url}; using defaults`)
    raw = { scores: {}, issues: [], quickWins: [] }
  }

  const normalizeScore = (v: any) => {
    const n = Number(v)
    if (!isFinite(n)) return 0
    return Math.max(0, Math.min(100, Math.round(n)))
  }
  const allowedSev = new Set(['critical', 'high', 'medium', 'low'])
  const allowedCat = new Set(['on-page', 'technical', 'content', 'ai-readiness', 'ai_readiness', 'aiReadiness', 'performance'])
  const normCat = (c: any): Issue['category'] => {
    const s = String(c || '').toLowerCase()
    if (s === 'ai-readiness' || s === 'ai_readiness' || s === 'aireadiness') return 'ai-readiness' as any
    if (s === 'onpage' || s === 'on-page') return 'on-page' as any
    if (s === 'technical') return 'technical'
    if (s === 'content') return 'content'
    if (s === 'performance') return 'performance'
    return 'on-page' as any
  }
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)

  const scores = {
    onPage: normalizeScore(raw?.scores?.onPage ?? raw?.scores?.on_page),
    technical: normalizeScore(raw?.scores?.technical),
    content: normalizeScore(raw?.scores?.content),
    aiReadiness: normalizeScore(raw?.scores?.aiReadiness ?? raw?.scores?.ai_readiness ?? raw?.scores?.aiReadinessScore),
    performance: normalizeScore(raw?.scores?.performance)
  }

  const issues = Array.isArray(raw?.issues) ? raw.issues.map((i: any): Issue => {
    const category = normCat(i?.category)
    const summary = String(i?.summary || i?.title || '').trim() || 'Unspecified issue'
    const id = String(i?.id || slug(`${category}:${summary}`))
    const severityRaw = String(i?.severity || '').toLowerCase()
    const severity = allowedSev.has(severityRaw as any) ? severityRaw as Issue['severity'] : 'medium'
    const rationale = String(i?.rationale || i?.reason || '')
    const fixSteps = Array.isArray(i?.fixSteps) ? i.fixSteps.map((s: any) => String(s)) : []
    const snippet = i?.snippet && typeof i.snippet === 'object' ? {
      type: (i.snippet.type === 'meta' || i.snippet.type === 'html' || i.snippet.type === 'jsonld' || i.snippet.type === 'robots') ? i.snippet.type : 'html',
      code: String(i.snippet.code || '')
    } : undefined
    return { id, category, severity, summary, rationale, fixSteps, snippet }
  }) : []

  const quickWins = Array.isArray(raw?.quickWins) ? raw.quickWins.map((s: any) => String(s)) : []

  return {
    url: facts.url,
    scores,
    issues,
    quickWins
  }
}
