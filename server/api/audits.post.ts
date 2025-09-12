import { createSupabaseServerClient } from '../utils/supabaseServer'
import { slugify } from '../utils/slug'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string, target?: string, slug?: string }>(event)
  if (!body?.target) {
    throw createError({ statusCode: 400, statusMessage: 'target is required' })
  }

  const name = (body.name || new URL(body.target).hostname).slice(0, 120)
  const baseSlug = slugify(body.slug || name)

  const supabase = await createSupabaseServerClient(event)

  // Attempt unique slug; add a short suffix if conflict
  let attempt = 0
  let slug = baseSlug
  while (attempt < 3) {
    const { data, error } = await supabase
      .from('audits')
      .insert({ name, slug, target_url: body.target })
      .select('*')
      .single()
    if (!error) return data
    if (error.code === '23505') { // unique violation
      attempt++
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
      continue
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  throw createError({ statusCode: 409, statusMessage: 'Unable to create unique slug' })
})

