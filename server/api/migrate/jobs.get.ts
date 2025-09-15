import { createSupabaseServerClient } from '~~/server/utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const supabase = await createSupabaseServerClient(event)
  const q = getQuery(event)
  const limit = Math.max(1, Math.min(100, Number(q.limit || 25)))
  const status = typeof q.status === 'string' ? q.status : undefined
  let query = supabase
    .from('migration_jobs')
    .select('id, status, created_at, updated_at, last_error, payload, results')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const rows = (data || []).map((r: any) => {
    const results = r.results || {}
    const resArr = Array.isArray(results?.results) ? results.results : []
    const ok = resArr.filter((x: any) => x?.status === 'ok').length
    const err = resArr.filter((x: any) => x?.status === 'error').length
    const planned = Array.isArray(r.payload?.includedUrls) ? r.payload.includedUrls.length : null
    return {
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      planned,
      ok,
      errorCount: err,
      lastError: r.last_error || null
    }
  })
  return { jobs: rows }
})
