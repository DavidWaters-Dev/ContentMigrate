import { createSupabaseAdminClient } from '../../utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const supabase = createSupabaseAdminClient()
  const workerId = process.env.WORKER_ID || `nitro-${process.pid}`
  const batch = Math.max(1, Math.min(10, Number(process.env.MIGRATION_WORKER_BATCH || 3)))
  const concurrency = Math.max(1, Math.min(5, Number(process.env.MIGRATION_WORKER_CONCURRENCY || 1)))
  const limit = Math.min(batch, concurrency)

  const { data: jobs, error } = await supabase.rpc('fn_migration_jobs_claim', {
    p_worker_id: workerId,
    p_limit: limit
  })
  if (error) {
    console.error('[WorkerTick] claim error:', error.message)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const claimed = Array.isArray(jobs) ? jobs : []
  let processed = 0
  await Promise.all(claimed.map(async (job: any) => {
    try {
      const payload = job.payload || {}
      const res = await $fetch('/api/migrate', { method: 'POST', body: { ...payload, skipQuota: true } })
      await supabase.rpc('fn_migration_jobs_complete', {
        p_job_id: job.id,
        p_status: 'completed',
        p_results: res,
        p_logs: (res as any)?.logs || []
      })
      processed++
    } catch (e: any) {
      await supabase.rpc('fn_migration_jobs_complete', {
        p_job_id: job.id,
        p_status: 'failed',
        p_last_error: e?.message || String(e)
      })
    }
  }))

  return { claimed: claimed.length, processed }
})
