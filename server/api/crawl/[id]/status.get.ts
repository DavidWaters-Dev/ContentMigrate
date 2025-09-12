import { crawlJobs } from '~/utils/crawl'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string
  const job = crawlJobs.get(id)
  if (!job) return { status: 'missing', discovered: [], fetched: [], logs: [] }
  return {
    status: job.status,
    discovered: Array.from(job.discovered),
    fetched: Array.from(job.fetched.keys()),
    error: job.error,
    logs: job.logs
  }
})
