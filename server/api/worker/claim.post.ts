import { createSupabaseServerClient } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ workerId: string, types?: string[], limit?: number }>(event)
  if (!body?.workerId) throw createError({ statusCode: 400, statusMessage: 'workerId required' })
  const supabase = await createSupabaseServerClient(event)
  const { data, error } = await supabase.rpc('fn_jobs_claim', {
    p_worker_id: body.workerId,
    p_types: body.types || null,
    p_limit: body.limit ?? 1
  })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { jobs: data || [] }
})
