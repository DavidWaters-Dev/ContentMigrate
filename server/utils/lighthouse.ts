import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'

/**
 * Run a Lighthouse audit for the provided URL. Returns the full Lighthouse
 * result JSON along with normalized category scores (0-100).
 */
export async function auditWithLighthouse (url: string) {
  const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'] })
  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'seo', 'best-practices', 'accessibility']
    })
    const lhr = runnerResult.lhr
    const scores = {
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100)
    }
    return { report: lhr, scores }
  } finally {
    await chrome.kill()
  }
}

