import { getJob } from '../../../../utils/migration-queue'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string
  const job = getJob(id)
  if (!job) return { status: 'missing' }
  return {
    id: job.id,
    status: job.status,
    logs: job.logs,
    results: job.results,
    error: job.error
  }
})

