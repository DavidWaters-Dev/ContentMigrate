export default defineNitroPlugin((nitro) => {
  const enabled = String(process.env.MIGRATION_WORKER || '1').toLowerCase()
  if (!(enabled === '1' || enabled === 'true' || enabled === 'yes')) return

  const intervalMs = Math.max(1000, Number(process.env.MIGRATION_INTERVAL_MS || 3000))
  let running = false
  let timer: NodeJS.Timer | null = null

  async function tick() {
    if (running) return
    running = true
    try {
      await nitro.localFetch('/api/migrate/process', { method: 'POST' })
    } catch (e: any) {
      console.error('[MigrationWorker] error:', e?.message || e)
    } finally {
      running = false
    }
  }

  timer = setInterval(tick, intervalMs)
  setTimeout(tick, 1000)
  nitro.hooks.hookOnce('close', () => { if (timer) clearInterval(timer) })
})

