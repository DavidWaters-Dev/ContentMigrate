import { createSupabaseServerClient } from './supabaseServer'

export async function addUsage(event: any, action: string, amount: number, limit: number, period: 'day'|'month' = 'day', timezone = 'UTC') {
  const supabase = await createSupabaseServerClient(event)
  const { data, error } = await supabase.rpc('fn_usage_add', {
    p_action: action,
    p_amount: amount,
    p_limit: limit,
    p_period: period,
    p_timezone: timezone
  })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const row = Array.isArray(data) ? data[0] : data
  return row as { allowed: boolean; remaining: number; current_count: number }
}

