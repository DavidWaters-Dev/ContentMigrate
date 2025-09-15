import { createSupabaseServerClient } from '~~/server/utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const supabase = await createSupabaseServerClient(event)
  const q = getQuery(event)
  const search = typeof q.q === 'string' ? q.q : ''
  const status = typeof q.status === 'string' && q.status ? q.status : undefined
  const limit = Math.max(1, Math.min(200, Number(q.limit || 50)))
  const page = Math.max(1, Number(q.page || 1))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from('content_pages').select('id,url,path,status,migrated_at,created_at', { count: 'exact' })
  if (search) query = query.ilike('url', `%${search}%`)
  if (status) query = query.eq('status', status)
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { pages: data || [], count: count || 0, page, limit }
})

