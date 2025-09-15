import type { FrontmatterField, OutputFormats } from '~/types/migrate'

type ConvertedRecord = {
  url: string
  slug: string
  mdPath?: string
  ymlPath?: string
  jsonPath?: string
  at: string
}

export const useMigrateStore = () => {
  const settings = useState('migrate_settings', () => ({
    clientSave: false,
    frontmatter: [
      { key: 'title' },
      { key: 'date' },
      { key: 'mainImage' },
      { key: 'description' },
    ] as FrontmatterField[],
    additionalPrompt: '',
    selector: 'article',
    output: { md: true, yml: true, json: true, csv: false } as OutputFormats,
    slugStrategy: 'path' as 'path' | 'title'
  }))

  // Converted map keyed by URL
  const convertedMap = useState<Record<string, ConvertedRecord>>('migrated_pages', () => ({}))

  // Persist to localStorage
  if (process.client) {
    const load = () => {
      try {
        const raw = localStorage.getItem('migrated_pages')
        if (raw) convertedMap.value = JSON.parse(raw)
        const rawSet = localStorage.getItem('migrate_settings')
        if (rawSet) settings.value = { ...settings.value, ...(JSON.parse(rawSet) || {}) }
      } catch {}
    }
    const save = () => {
      try {
        localStorage.setItem('migrated_pages', JSON.stringify(convertedMap.value))
        localStorage.setItem('migrate_settings', JSON.stringify(settings.value))
      } catch {}
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', load, { once: true })
    } else {
      load()
    }
    watch([convertedMap, settings] as any, save, { deep: true })
  }

  return { settings, convertedMap }
}
