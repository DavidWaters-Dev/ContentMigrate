import { defineEventHandler, getRequestURL } from 'h3'

type Counter = { count: number; resetAt: number }
const buckets = new Map<string, Counter>()

const WINDOW_MS = Math.max(1000, Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000))
const MAX_REQ = Math.max(1, Number(process.env.RATE_LIMIT_MAX || 60))
const PROTECTED_PREFIXES = (process.env.RATE_LIMIT_PREFIXES || '/api/crawl,/api/migrate').split(',')

function getIp(event: any) {
  const xf = event.node?.req?.headers['x-forwarded-for'] as string | undefined
  if (xf) return xf.split(',')[0].trim()
  // @ts-ignore
  return event.node?.req?.socket?.remoteAddress || 'unknown'
}

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname
  if (!PROTECTED_PREFIXES.some(p => p && path.startsWith(p))) return

  const ip = getIp(event)
  const key = `${ip}:${path}`
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  entry.count++
  if (entry.count > MAX_REQ) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }
})

