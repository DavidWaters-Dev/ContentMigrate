import { createSupabaseServerClient } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const { auditId } = getRouterParams(event)
  if (!auditId) throw createError({ statusCode: 400, statusMessage: 'auditId required' })

  const supabase = await createSupabaseServerClient(event)

  // Best-effort delete of related rows first (in case FK cascade is not set)
  const { error: pagesErr } = await supabase
    .from('audit_pages')
    .delete()
    .eq('audit_id', auditId)
  if (pagesErr) {
    // Not fatal if table or rows missing, but surface actual DB errors
    if (!/relation .* does not exist/i.test(pagesErr.message)) {
      throw createError({ statusCode: 500, statusMessage: pagesErr.message })
    }
  }

  const { error } = await supabase
    .from('audits')
    .delete()
    .eq('id', auditId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true }
})

