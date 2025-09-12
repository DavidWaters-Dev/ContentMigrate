import { createSupabaseServerClient } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const { auditId } = getRouterParams(event)
  if (!auditId) throw createError({ statusCode: 400, statusMessage: 'auditId required' })

  const body = await readBody<Partial<{ name: string; target: string; status: string }>>(event)
  const update: any = { updated_at: new Date().toISOString() }

  if (typeof body.name === 'string') update.name = body.name
  if (typeof body.target === 'string') update.target_url = body.target
  if (typeof body.status === 'string') update.status = body.status

  // No-op check
  if (Object.keys(update).length === 1) {
    throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' })
  }

  const supabase = await createSupabaseServerClient(event)
  const { data, error } = await supabase
    .from('audits')
    .update(update)
    .eq('id', auditId)
    .select('*')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})

