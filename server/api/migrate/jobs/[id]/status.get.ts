import { createSupabaseServerClient } from '../../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string
  const supabase = await createSupabaseServerClient(event)
  const { data, error } = await supabase
    .from('migration_jobs')
    .select('id, status, logs, results, last_error, created_at, updated_at')
    .eq('id', id)
    .single()
  if (error) throw createError({ statusCode: 404, statusMessage: error.message })
  return {
    id: data?.id,
    status: data?.status,
    logs: (data as any)?.logs || [],
    results: (data as any)?.results || null,
    error: (data as any)?.last_error || null,
    createdAt: (data as any)?.created_at || null,
    updatedAt: (data as any)?.updated_at || null
  }
})
