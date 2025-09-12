import type { PageAudit, SiteSummary } from '~/types'

export const useAuditStore = () => {
  const rootUrl = useState<string>('rootUrl', () => '')
  const crawlId = useState<string | null>('crawlId', () => null)
  const pages = useState<PageAudit[]>('pages', () => [])
  const site = useState<SiteSummary | null>('site', () => null)
  const crawlLogs = useState<string[]>('crawl_logs', () => [])
  const analysisLogs = useState<string[]>('analysis_logs', () => [])
  const analyzing = useState<boolean>('analyzing', () => false)
  const status = useState('crawlStatus', () => ({
    running: false,
    discovered: [] as string[],
    fetched: [] as string[],
    error: ''
  }))

  return { rootUrl, crawlId, pages, site, status, analyzing, crawlLogs, analysisLogs }
}
