import { randomUUID } from 'node:crypto'

export type MigrationJobPayload = {
  crawlId: string
  includedUrls?: string[]
  options?: any
}

export type MigrationJob = {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  submittedBy?: string
  createdAt: number
  updatedAt: number
  payload: MigrationJobPayload
  logs: string[]
  results?: any
  error?: string
}

const jobs = new Map<string, MigrationJob>()

export function enqueueMigration(payload: MigrationJobPayload, submittedBy?: string) {
  const id = randomUUID()
  const job: MigrationJob = {
    id,
    status: 'queued',
    submittedBy,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    payload,
    logs: []
  }
  jobs.set(id, job)
  return id
}

export function getJob(id: string) {
  return jobs.get(id)
}

export function claimNextJob(): MigrationJob | null {
  for (const j of jobs.values()) {
    if (j.status === 'queued') {
      j.status = 'processing'
      j.updatedAt = Date.now()
      return j
    }
  }
  return null
}

export function completeJob(id: string, results: any) {
  const j = jobs.get(id)
  if (!j) return
  j.status = 'completed'
  j.results = results
  j.updatedAt = Date.now()
}

export function failJob(id: string, error: string) {
  const j = jobs.get(id)
  if (!j) return
  j.status = 'failed'
  j.error = error
  j.updatedAt = Date.now()
}

