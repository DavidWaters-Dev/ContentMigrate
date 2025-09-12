import { createSupabaseServerClient } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug required' })
  const supabase = await createSupabaseServerClient(event)
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw createError({ statusCode: 404, statusMessage: 'Audit not found' })
  return data
})

