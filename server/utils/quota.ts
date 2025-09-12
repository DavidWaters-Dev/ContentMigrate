import { createSupabaseServerClient } from './supabaseServer'

export async function checkAndIncrementQuota(
  event: any,
  action: string,
  limit: number,
  period: 'day' | 'month' = 'day'
) {
  const supabase = await createSupabaseServerClient(event)
  console.log('[Quota] Checking', { action, limit, period })
  const { data, error } = await supabase.rpc('fn_check_and_increment', {
    p_action: action,
    p_limit: limit,
    p_period: period,
  })
  if (error) {
    console.error('[Quota] RPC error', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  const row = Array.isArray(data) ? data[0] : data
  console.log('[Quota] Result', row)
  return row as { allowed: boolean; remaining: number; current_count: number }
}
