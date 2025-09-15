import { createSupabaseServerClient } from '~~/server/utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string
  const body = await readBody<{ action?: string }>(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  if (body?.action !== 'cancel') throw createError({ statusCode: 400, statusMessage: 'unsupported action' })
  const supabase = await createSupabaseServerClient(event)
  const { data, error } = await supabase
    .from('migration_jobs')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'queued')
    .select('id, status')
    .single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { id: data?.id, status: data?.status }
})
