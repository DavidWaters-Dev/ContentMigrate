export default defineNitroPlugin((nitroApp) => {
  const enabled = String(process.env.ANALYSIS_WORKER || '').toLowerCase()
  if (!(enabled === '1' || enabled === 'true' || enabled === 'yes')) {
    return
  }

  const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 3000)
  const batch = Math.max(1, Math.min(10, Number(process.env.WORKER_BATCH || 3)))
  const workerId = process.env.WORKER_ID || `nitro-${process.pid}`

  let timer: NodeJS.Timer | null = null
  async function tick() {
    try {
      await nitroApp.localFetch('/api/worker/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limit: batch, workerId })
      })
    } catch (e: any) {
      console.error('[AnalysisWorker] process tick error:', e?.message || e)
    }
  }

  // Kick off loop
  timer = setInterval(tick, intervalMs)
  // Prime an initial tick shortly after boot
  setTimeout(tick, 1000)

  nitroApp.hooks.hookOnce('close', () => {
    if (timer) clearInterval(timer)
  })
})
