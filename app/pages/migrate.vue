<template>
  <UContainer class="py-24 space-y-10">
    <section class="text-center space-y-4">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 text-xs text-zinc-600">
        <span class="i-lucide-sparkles" />
        AI-powered content migration to Markdown
      </div>
      <h1 class="text-6xl md:text-7xl max-w-2xl mx-auto font-semibold tracking-tight">
        Migrate your content
      </h1>
      <p class="text-zinc-600 max-w-2xl mx-auto">
        Crawl a site, select pages, configure frontmatter and output folders, then convert to Markdown with images saved locally.
      </p>
    </section>

    <!-- Steps -->
    <div class="space-y-8">
      <!-- Start / Crawl -->
      <section v-if="step === 'start'" class="space-y-6">
        <UrlForm @started="() => {}" />
      </section>

      <!-- Select pages & Configure -->
      <section v-else-if="step === 'select'" class="space-y-6">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h2 class="text-lg font-semibold">Select pages to migrate</h2>
          <div class="flex items-center gap-2">
            <UButton color="neutral" variant="ghost" icon="i-lucide-database" @click="importCrawl">Import crawled URLs to list</UButton>
            <UButton color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" @click="resetAll">Restart</UButton>
          </div>
        </div>

        <UCard>
          <div class="overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-left text-zinc-600">
                <tr>
                  <th class="p-2 w-10">
                    <UCheckbox :model-value="allSelected" @update:model-value="toggleAll" aria-label="Select all" />
                  </th>
                  <th class="p-2">URL</th>
                  <th class="p-2 w-36">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="url in urlsForSelection" :key="url" class="border-t">
                  <td class="p-2 align-top">
                    <UCheckbox :model-value="includedSet.has(url)" @update:model-value="(v) => toggleOne(url, v)" :aria-label="`Select ${url}`" />
                  </td>
                  <td class="p-2">
                    <a :href="url" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline break-all">{{ url }}</a>
                  </td>
                  <td class="p-2 align-top">
                    <UBadge v-if="convertedMap[url]" color="success" variant="soft" label="Converted" />
                    <span v-else class="text-zinc-400">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <!-- DB-backed pages list (search, paginate, select with max per run) -->
        <UCard>
          <div class="flex items-center gap-3 mb-3 flex-wrap">
            <UInput v-model="q" placeholder="Search URLs (e.g., /news)" class="flex-1" />
            <div class="flex items-center gap-2">
              <USwitch v-model="hideMigrated" />
              <span class="text-sm">Hide migrated</span>
            </div>
            <div class="flex items-center gap-2">
              <UInput v-model.number="maxPerRun" type="number" min="1" class="w-28" />
              <span class="text-xs text-zinc-500">Max per run</span>
            </div>
          </div>
          <div class="overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-left text-zinc-600">
                <tr>
                  <th class="p-2 w-10">
                    <UCheckbox :model-value="false" @update:model-value="selectAllOnPage" aria-label="Select all on page" />
                  </th>
                  <th class="p-2">URL</th>
                  <th class="p-2 w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in dbPages" :key="p.id" class="border-t">
                  <td class="p-2 align-top">
                    <UCheckbox :model-value="selectedSet.has(p.url)" :disabled="!selectedSet.has(p.url) && selectedSet.size >= maxPerRun" @update:model-value="() => toggleSelect(p.url)" />
                  </td>
                  <td class="p-2"><a :href="p.url" target="_blank" rel="noopener" class="text-blue-700 underline break-all">{{ p.url }}</a></td>
                  <td class="p-2"><UBadge :color="p.status==='migrated'?'success':'neutral'" :label="p.status" variant="soft" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex items-center justify-between mt-3 text-sm">
            <div>Selected: {{ selectedSet.size }} / {{ maxPerRun }}</div>
            <div class="flex items-center gap-2">
              <UButton size="xs" variant="ghost" @click="() => { if(page>1){ page--; } }">Prev</UButton>
              <span>Page {{ page }}</span>
              <UButton size="xs" variant="ghost" @click="() => { if(page*limit < total){ page++; } }">Next</UButton>
            </div>
          </div>
        </UCard>

        <MigrationSettings />

        <div class="flex items-center gap-3 flex-wrap">
          <UButton :disabled="includedUrls.length === 0" :loading="migrating" icon="i-lucide-file-down" @click="runMigration">
            Migrate selected pages ({{ includedUrls.length }})
          </UButton>
          <span class="text-sm text-zinc-500" v-if="migrating">Migrating…</span>
        </div>

        <UAlert
          v-if="okCount === 0 && migrationLogs.length"
          color="warning"
          icon="i-lucide-alert-circle"
          title="No pages converted"
          description="Check your OpenAI API key, page selection, and optional CSS selector (e.g., 'article')."
          variant="soft"
        />

        <UCard v-if="migrationLogs.length" class="text-sm">
          <div class="flex items-center gap-6">
            <div>Converted: <span class="font-medium">{{ okCount }}</span></div>
            <div>Errors: <span class="font-medium">{{ errorCount }}</span></div>
          </div>
        </UCard>
      </section>

      <!-- Migrating -->
      <section v-else-if="step === 'migrating'" class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="i-lucide-loader-2 animate-spin" />
          <h2 class="text-lg font-semibold">Processing selected pages…</h2>
        </div>
        <UCard v-if="migrationLogs.length" class="text-sm whitespace-pre-wrap max-h-60 overflow-auto" aria-live="polite">
          <div class="font-semibold mb-1">Migration Logs</div>
          <div>
            <div v-for="(line, idx) in migrationLogs" :key="idx">{{ line }}</div>
          </div>
        </UCard>
      </section>
    </div>

    <section class="space-y-6">
      <UAlert v-if="status.error" color="error" icon="i-lucide-alert-triangle" title="Something went wrong" :description="status.error" variant="soft" />
      <CrawlProgress v-if="status.running" />
    </section>
  </UContainer>
</template>

<script setup lang="ts">
  import UrlForm from '~/components/UrlForm.vue'
  import CrawlProgress from '~/components/CrawlProgress.vue'
  import MigrationSettings from '~/components/MigrationSettings.vue'
  import type { MigrationResponse } from '~/types/migrate'

  const store = useAuditStore()
  const migrate = useMigrateStore()
  const { status, crawlId } = store
  const { settings, convertedMap } = migrate

  const migrating = ref(false)
  const migrationLogs = ref<string[]>([])
  const okCount = ref(0)
  const errorCount = ref(0)

  // DB-backed pages state
  const q = ref('')
  const hideMigrated = ref(true)
  const page = ref(1)
  const limit = ref(50)
  const total = ref(0)
  const dbPages = ref<Array<{ id:string; url:string; path:string; status:string }>>([])
  const selectedSet = ref<Set<string>>(new Set())
  const maxPerRun = ref(50)
  async function loadPages() {
    try {
      const params = new URLSearchParams()
      if (q.value) params.set('q', q.value)
      if (hideMigrated.value) params.set('status', 'new')
      params.set('limit', String(limit.value))
      params.set('page', String(page.value))
      const res = await $fetch<{ pages:any[]; count:number; page:number; limit:number }>(`/api/pages?${params.toString()}`)
      dbPages.value = res.pages as any
      total.value = res.count
      const urlsOnPage = new Set(dbPages.value.map(p => p.url))
      for (const u of Array.from(selectedSet.value)) { if (!urlsOnPage.has(u)) selectedSet.value.delete(u) }
    } catch {}
  }
  watch([q, hideMigrated, page, limit] as any, loadPages)
  onMounted(() => { loadPages() })
  function toggleSelect(url: string) {
    const s = selectedSet.value
    if (s.has(url)) { s.delete(url); return }
    if (s.size >= maxPerRun.value) return
    s.add(url)
  }
  function selectAllOnPage() {
    for (const p of dbPages.value) {
      if (hideMigrated.value && p.status !== 'new') continue
      if (selectedSet.value.size >= maxPerRun.value) break
      selectedSet.value.add(p.url)
    }
  }

  const crawlDone = computed(() => !status.value.running && status.value.discovered.length > 0)
  const step = computed<'start' | 'select' | 'migrating'>(() => {
    if (migrating.value) return 'migrating'
    if (crawlDone.value) return 'select'
    return 'start'
  })

  const includedUrls = ref<string[]>([])
  const includedSet = computed(() => new Set(includedUrls.value))
  const urlsForSelection = computed(() => status.value.discovered as string[])
  const allSelected = computed(() => urlsForSelection.value.length > 0 && includedUrls.value.length === urlsForSelection.value.length)

  watch(crawlDone, (done) => {
    if (done) includedUrls.value = [...status.value.discovered]
    else if (!status.value.running) includedUrls.value = []
  })

  function toggleAll(value: boolean | 'indeterminate') {
    if (value === true) includedUrls.value = [...urlsForSelection.value]
    else if (value === false) includedUrls.value = []
  }
  function toggleOne(url: string, value: boolean | 'indeterminate') {
    const next = new Set(includedUrls.value)
    if (value === true) next.add(url)
    else if (value === false) next.delete(url)
    includedUrls.value = [...next]
  }

  function resetAll() {
    crawlId.value = null
    status.value.running = false
    status.value.discovered = []
    status.value.fetched = []
    status.value.error = ''
    includedUrls.value = []
    migrationLogs.value = []
  }

  async function importCrawl() {
    try {
      await $fetch('/api/pages/import-from-crawl', { method: 'POST', body: { crawlId: crawlId.value, rootUrl: store.rootUrl.value } })
      await loadPages()
    } catch (e:any) {
      status.value.error = e?.data?.statusMessage || e?.message || String(e)
    }
  }

  async function runMigration() {
    if (!crawlId.value) return
    if (status.value.fetched.length === 0) {
      status.value.error = 'No pages fetched. Check crawl logs above.'
      return
    }
    try {
      migrating.value = true
      migrationLogs.value = []
      const urls = includedUrls.value.length ? includedUrls.value : Array.from(selectedSet.value)
      const res = await $fetch<MigrationResponse>('/api/migrate', {
        method: 'POST',
        body: { crawlId: crawlId.value, includedUrls: urls, options: { output: settings.value.output, selector: settings.value.selector, frontmatter: settings.value.frontmatter, slugStrategy: settings.value.slugStrategy } }
      })
      migrationLogs.value = res.logs || []
      okCount.value = Array.isArray(res.results) ? res.results.filter(r => r.status === 'ok').length : 0
      errorCount.value = Array.isArray(res.results) ? res.results.filter(r => r.status === 'error').length : 0
      if (Array.isArray(res.results)) {
        for (const r of res.results) {
          if (r.status === 'ok') {
            convertedMap.value[r.url] = { url: r.url, slug: r.slug, mdPath: r.mdPath, ymlPath: r.ymlPath, jsonPath: r.jsonPath, at: new Date().toISOString() }
          }
        }
        const okUrls = res.results.filter(r => r.status==='ok').map(r => r.url)
        if (okUrls.length) {
          try { await $fetch('/api/pages/migrated', { method: 'PATCH', body: { urls: okUrls } }); await loadPages() } catch {}
          selectedSet.value = new Set()
        }
      }
    } catch (e: any) {
      status.value.error = e?.data?.statusMessage || e?.message || String(e)
      migrationLogs.value.push(`Error: ${status.value.error}`)
    } finally {
      migrating.value = false
    }
  }

  // Files are written on the server to ~/Downloads/contentmigrate
</script>
