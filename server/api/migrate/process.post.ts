import { claimNextJob, completeJob, failJob } from '../../utils/migration-queue'

export default defineEventHandler(async (event) => {
  const job = claimNextJob()
  if (!job) return { claimed: 0 }
  try {
    job.logs.push(`[Worker] Processing job ${job.id} with ${job.payload.includedUrls?.length || 0} pages`)
    const res = await $fetch('/api/migrate', {
      method: 'POST',
      body: { ...job.payload, skipQuota: true }
    })
    job.logs.push('[Worker] Completed')
    completeJob(job.id, res)
    return { claimed: 1, status: 'completed' }
  } catch (e: any) {
    job.logs.push(`[Worker] Failed: ${e?.message || e}`)
    failJob(job.id, e?.message || String(e))
    return { claimed: 1, status: 'failed' }
  }
})
