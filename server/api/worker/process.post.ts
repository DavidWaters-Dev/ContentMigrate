import { createSupabaseAdminClient } from '../../utils/supabaseAdmin'
import { extractPageFacts } from '~/utils/html'
import { analyzePage } from '~/utils/ai'
import { consolidateSite } from '~/utils/seo'
import { auditWithLighthouse } from '../../utils/lighthouse'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ limit?: number, workerId?: string }>(event)
  const supabase = createSupabaseAdminClient()
  const workerId = body?.workerId || 'web-worker'
  const limit = Math.max(1, Math.min(10, body?.limit || 5))

  // Claim a batch of jobs for the current user context
  const { data: jobs, error: claimErr } = await supabase.rpc('fn_jobs_claim', {
    p_worker_id: workerId,
    p_types: ['page_analysis'],
    p_limit: limit
  })
  if (claimErr) throw createError({ statusCode: 500, statusMessage: claimErr.message })

  const processed: string[] = []
  const auditsToRecalc = new Set<string>()

  for (const job of jobs || []) {
    try {
      // Load page row
      const { data: pageRow, error: pageErr } = await supabase
        .from('audit_pages')
        .select('id, audit_id, url')
        .eq('id', job.page_id)
        .single()
      if (pageErr || !pageRow) throw new Error(pageErr?.message || 'Page not found')

      // Fetch and analyze
      const res = await fetch(pageRow.url, { headers: { 'User-Agent': 'AI SEO Auditor/1.0' } })
      const html = await res.text()
      const facts = extractPageFacts(html, pageRow.url)
      const pa = await analyzePage(facts)

      // Run Lighthouse for real-world performance metrics
      const lh = await auditWithLighthouse(pageRow.url)
      pa.scores.performance = lh.scores.performance

      // Compute overall score as average of categories
      const overall = Math.round((pa.scores.onPage + pa.scores.technical + pa.scores.content + pa.scores.aiReadiness + pa.scores.performance) / 5)

      // Persist
      const { error: updErr } = await supabase
        .from('audit_pages')
        .update({ status: 'analyzed', score: overall, details: { ...pa, lighthouse: lh.scores, lighthouseReport: lh.report } as any, updated_at: new Date().toISOString() })
        .eq('id', pageRow.id)
      if (updErr) throw new Error(updErr.message)

      // Mark complete
      await supabase.rpc('fn_jobs_complete', { p_job_id: job.id, p_status: 'completed', p_tokens_used: 0, p_last_error: null })
      processed.push(job.id)
      auditsToRecalc.add(pageRow.audit_id)
    } catch (e: any) {
      await supabase.rpc('fn_jobs_complete', { p_job_id: job.id, p_status: 'failed', p_tokens_used: 0, p_last_error: String(e?.message || e) })
    }
  }

  // Recalculate site summaries for affected audits
  for (const auditId of auditsToRecalc) {
    const { data: pages, error: listErr } = await supabase
      .from('audit_pages')
      .select('url, details')
      .eq('audit_id', auditId)
      .eq('status', 'analyzed')
    if (listErr) continue
    const pageAudits = (pages || []).map(p => ({ url: p.url, ...(p.details as any) }))
    const summary = consolidateSite(pageAudits)
    const now = new Date().toISOString()
    // Always refresh summary; do not flip archived audits back to ready
    await supabase
      .from('audits')
      .update({ summary, updated_at: now })
      .eq('id', auditId)
    await supabase
      .from('audits')
      .update({ status: 'ready', updated_at: now })
      .eq('id', auditId)
      .neq('status', 'archived')
  }

  return { claimed: (jobs || []).length, processed: processed.length }
})
