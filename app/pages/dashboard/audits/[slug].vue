<template>
  <UContainer class="py-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <template v-if="!editingName">
            <h1 class="truncate text-2xl font-semibold">{{ audit.name }}</h1>
            <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" aria-label="Rename" @click="startEditingName" />
          </template>
          <template v-else>
            <UInput v-model="nameDraft" size="sm" class="max-w-xs" />
            <UButton size="xs" color="primary" icon="i-lucide-check" @click="saveName" />
            <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="cancelEditingName" />
          </template>
          <UBadge v-if="audit.status === 'archived'" color="neutral" variant="subtle" icon="i-heroicons-archive-box">Archived</UBadge>
        </div>
        <p class="text-sm text-[var(--color-foreground-subtle)] truncate">
          {{ audit.target }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="ghost" icon="i-heroicons-arrow-uturn-left" to="/dashboard">Back</UButton>
        <UButton color="primary" icon="i-heroicons-arrow-path" @click="onReCrawl">Re-crawl</UButton>
        <UDropdownMenu :items="detailMenu">
          <UButton icon="i-heroicons-ellipsis-horizontal" variant="ghost" color="neutral" aria-label="More" />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Insights (only after analyzing) -->
    <Transition name="fade-slide">
      <div v-if="phase === 'insights'" class="space-y-4">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-lightbulb" class="text-[var(--color-accent)]" />
                <span class="font-medium">Consolidated Report</span>
              </div>
              <UBadge :color="scoreColor(report.healthScore)" variant="soft">Health {{ report.healthScore }}</UBadge>
            </div>
          </template>

          <!-- Score badges -->
          <div class="flex flex-wrap gap-2 mb-4">
            <ScoreBadge label="Health" :score="report.healthScore" />
            <ScoreBadge v-for="(v, k) in report.categoryScores" :key="k" :label="k" :score="v" />
          </div>
          <div class="flex flex-wrap gap-2 mb-4">
            <ScoreBadge v-for="(v, k) in report.lighthouseAverage" :key="'lh-' + k" :label="k" :score="v" />
          </div>

          <!-- Top opportunities -->
          <div class="space-y-2">
            <h3 class="text-sm font-medium">Top Opportunities</h3>
            <div class="grid md:grid-cols-2 gap-4">
              <IssueCard v-for="i in topIssues" :key="i.id + '-top'" :issue="i" />
            </div>
          </div>

          <!-- All issues -->
          <div class="space-y-2 mt-4">
            <h3 class="text-sm font-medium">Issues</h3>
            <div class="grid md:grid-cols-2 gap-4">
              <IssueCard v-for="i in report.consolidatedIssues" :key="i.id" :issue="i" />
            </div>
          </div>

          <!-- Coverage and export -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <div class="text-sm font-medium mb-1">Coverage</div>
              <p class="text-sm text-[var(--color-foreground-subtle)]">Analyzed {{ analyzedCount }} of {{ allRows.length }} pages</p>
            </div>
            <div class="md:col-span-2 flex items-center gap-2">
              <UButton icon="i-lucide-file-down" color="neutral" variant="outline" @click="exportCsv">Export CSV</UButton>
              <UButton icon="i-lucide-file-text" color="neutral" variant="outline" @click="exportPdf">Export PDF</UButton>
            </div>
          </div>
        </UCard>
      </div>
    </Transition>

    <!-- Crawled/Analyzing table appears above settings when phase != start -->
    <Transition name="fade-slide">
      <div v-if="phase !== 'start'">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="font-medium">Crawled Pages</div>
                <UBadge color="neutral" variant="soft">{{ allRows.length }}</UBadge>
                <UBadge v-if="phase === 'analyzing'" color="warning" variant="subtle" icon="i-lucide-loader-2">Analyzing…</UBadge>
              </div>
              <div class="flex items-center gap-2">
                <UInput v-model="q" icon="i-heroicons-magnifying-glass" placeholder="Filter pages..." size="sm" />
                <UButton color="neutral" variant="ghost" size="sm" @click="selectAllShown">Select shown</UButton>
                <UButton color="neutral" variant="ghost" size="sm" @click="clearSelection">Clear</UButton>
                <UButton color="primary" variant="soft" icon="i-lucide-sparkles" :disabled="selectedIds.length===0" @click="analyzeSelected">
                  Analyze selected ({{ selectedIds.length }})
                </UButton>
              </div>
            </div>
          </template>

          <UTable
            v-model:expanded="expanded"
            :data="filteredRows"
            :columns="columns"
            :row-key="'id'"
            :sort="sort"
            @update:sort="sort = $event"
            :ui="{ tr: 'data-[expanded=true]:bg-[var(--color-background-subtle)]/50' }"
            class="overflow-x-auto"
          >
            <template #expanded="{ row }">
              <div class="p-4 bg-[var(--color-background-subtle)] rounded">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div class="text-sm font-medium mb-1">SEO Title</div>
                    <div class="text-sm text-[var(--color-foreground-subtle)]">{{ row.original.details.title }}</div>
                  </div>
                  <div>
                    <div class="text-sm font-medium mb-1">Meta Description</div>
                    <div class="text-sm text-[var(--color-foreground-subtle)] truncate">{{ row.original.details.description }}</div>
                  </div>
                  <div>
                    <div class="text-sm font-medium mb-1">Issues</div>
                    <ul class="text-sm list-disc pl-4">
                      <li v-for="issue in row.original.details.issues" :key="issue">{{ issue }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </template>
          </UTable>

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-[var(--color-foreground-subtle)]">Showing {{ filteredRows.length }} of {{ filteredAll.length }}</div>
              <UPagination v-model="page" :page-count="pageCount" :total="filteredAll.length" />
            </div>
          </template>
        </UCard>
      </div>
    </Transition>

    <!-- Crawl input + advanced options (always at bottom) -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="font-medium">Crawl Settings</div>
          <UDropdownMenu :items="crawlMenu">
            <UButton icon="i-heroicons-ellipsis-horizontal" variant="ghost" color="neutral" aria-label="More" />
          </UDropdownMenu>
        </div>
      </template>
      <div class="space-y-4">
        <div class="flex flex-col md:flex-row gap-3">
          <UInput v-model="form.rootUrl" icon="i-lucide-globe" placeholder="https://example.com" size="lg" class="flex-1" />
          <UButton size="lg" icon="i-lucide-rocket" :loading="submitting" @click="startCrawl">Start</UButton>
        </div>
        <UAccordion :items="[{ label: 'Advanced Options', slot: 'adv' }]" variant="soft">
          <template #adv>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded border border-[var(--color-border)] bg-[var(--color-background-subtle)]">
              <UFormField label="Audit name" help="Used for identifying this audit and creating a slug.">
                <div class="flex items-center gap-2 mt-2">
                  <UInput v-model="audit.name" class="flex-1" placeholder="e.g. example.com – initial audit" />
                  <UButton variant="ghost" color="neutral" size="xs" @click="useSuggestedName" icon="i-lucide-sparkles">Suggest</UButton>
                </div>
                <p class="text-xs text-[var(--color-foreground-subtle)] mt-1">Suggested: {{ suggestedName }}</p>
              </UFormField>
              <UFormField label="Strategy" help="Sitemap is safest; internal follows links within domain">
                <USelect v-model="form.strategy" :items="strategies" />
              </UFormField>
              <UFormField label="Max pages" help="Cap to control scope">
                <UInput v-model.number="form.maxPages" type="number" min="1" max="500" />
              </UFormField>
              <UFormField label="Concurrency" help="Parallel fetches (capped at 2 for politeness)">
                <UInput v-model.number="form.concurrency" type="number" min="1" max="2" />
              </UFormField>
              <UFormField label="Respect robots.txt">
                <USwitch v-model="form.respectRobots" />
              </UFormField>
            </div>
          </template>
        </UAccordion>
      </div>
    </UCard>
  </UContainer>

  <!-- Delete confirm modal -->
  <UModal v-model:open="deleteOpen" title="Delete Audit" description="This action cannot be undone.">
    <template #body>
      <p class="text-sm text-[var(--color-foreground-subtle)]">
        Are you sure you want to delete
        <span class="font-medium">{{ audit.name }}</span>? This will permanently remove the audit and its pages.
      </p>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="outline" @click="deleteOpen = false" />
        <UButton label="Delete" color="error" :loading="deleting" @click="performDelete" />
      </div>
    </template>
  </UModal>

  
</template>

<script setup lang="ts">
  import { h, resolveComponent } from 'vue'
  import type { TableColumn } from '@nuxt/ui'
  import type { SiteSummary, Issue } from '~/types'

  const route = useRoute()
  const submitting = ref(false)

  function deriveNameFromUrl(url: string) {
    try { const u = new URL(url); return u.hostname } catch { return 'New Audit' }
  }

  // Phase workflow: start -> crawled -> analyzing -> insights (derived)
  type Phase = 'start' | 'crawled' | 'analyzing' | 'insights'

  // Audit state
  type AuditStatus = 'draft' | 'crawling' | 'crawled' | 'analyzing' | 'ready' | 'archived'
  const audit = reactive<{ id: string; name: string; target: string; status: AuditStatus | '' }>({ id: '', name: 'New Audit', target: 'https://example.com', status: '' })

  // Load audit by slug (SSR-friendly)
  const { data: auditFromDb, refresh: refreshAudit } = await useAsyncData(`audit-${route.params.slug}`, () => $fetch(`/api/audits/by-slug/${route.params.slug}`))
  if (auditFromDb.value) {
    audit.id = (auditFromDb.value as any).id
    audit.name = (auditFromDb.value as any).name
    audit.target = (auditFromDb.value as any).target_url
    audit.status = (auditFromDb.value as any).status as any
  }

  // Crawl form (dummy)
  const form = reactive({
    rootUrl: audit.target,
    maxPages: 50,
    strategy: 'sitemap+internal',
    concurrency: 2,
    respectRobots: true,
  })
  const strategies = [
    { label: 'Sitemap only', value: 'sitemap-only' },
    { label: 'Sitemap + internal', value: 'sitemap+internal' },
  ]

  // Name suggestions and editing
  const editingName = ref(false)
  const nameDraft = ref('')
  const userEditedName = ref(false)
  const suggestedName = computed(() => deriveNameFromUrl(form.rootUrl))
  function startEditingName() { nameDraft.value = audit.name; editingName.value = true }
  function cancelEditingName() { editingName.value = false }
  function saveName() { audit.name = nameDraft.value || suggestedName.value; userEditedName.value = true; editingName.value = false }
  function useSuggestedName() { audit.name = suggestedName.value; userEditedName.value = true }
  watch(() => form.rootUrl, (val) => {
    audit.target = val
    if (!userEditedName.value) audit.name = deriveNameFromUrl(val)
  })

  // Report (dummy)
  const report = reactive<SiteSummary>({
    healthScore: 0,
    categoryScores: { onPage: 0, technical: 0, content: 0, aiReadiness: 0, performance: 0 },
    consolidatedIssues: [],
    totals: { pages: 0, critical: 0, high: 0, medium: 0, low: 0 },
    lighthouseAverage: { performance: 0, seo: 0, accessibility: 0, bestPractices: 0 }
  })
  if ((auditFromDb.value as any)?.summary) Object.assign(report, (auditFromDb.value as any).summary)
  // Keep audit + report in sync with refreshed data
  watch(auditFromDb, (val) => {
    if (!val) return
    audit.id = (val as any).id
    audit.name = (val as any).name
    audit.target = (val as any).target_url
    audit.status = (val as any).status as any
    if ((val as any)?.summary) Object.assign(report, (val as any).summary)
  })
  const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
  const topIssues = computed(() => {
    return [...report.consolidatedIssues].sort((a: Issue, b: Issue) => {
      const wA = severityWeight[a.severity] || 0
      const wB = severityWeight[b.severity] || 0
      const pa = a.pagesAffected?.length || 0
      const pb = b.pagesAffected?.length || 0
      if (wA !== wB) return wB - wA
      if (pa !== pb) return pb - pa
      return a.summary.localeCompare(b.summary)
    }).slice(0, 4)
  })

  // Table state and data (dummy)
  type RowStatus = 'new' | 'crawled' | 'analyzed' | 'error'
  interface RowItem {
    id: string; url: string; score: number; status: RowStatus;
    lighthouse?: { performance: number; seo: number; accessibility: number; bestPractices: number };
    aiReadiness?: number;
    details: { title: string; description: string; issues: string[] }
  }
  const allRows = ref<RowItem[]>([])
  async function loadPages() {
    if (!audit.id) return
    const res = await $fetch<{ pages: any[] }>(`/api/audits/${audit.id}/pages`)
    allRows.value = (res.pages || []).map(p => ({
      id: p.id,
      url: p.url,
      score: p.score ?? 0,
      status: p.status as RowStatus,
      lighthouse: p.details?.lighthouse,
      aiReadiness: p.details?.scores?.aiReadiness ?? 0,
      details: p.details?.scores ? { title: p.details.title || '', description: p.details.description || '', issues: (p.details.issues || []).map((i: any) => i.summary || String(i)) } : { title: '', description: '', issues: [] }
    }))
  }
  onMounted(() => { loadPages() })
  watch(() => audit.id, () => loadPages())

  const q = ref('')
  const sort = ref<{ column: keyof RowItem | 'actions'; direction: 'asc' | 'desc' } | undefined>({ column: 'score', direction: 'desc' })
  const page = ref(1)
  const pageCount = 10
  const filteredAll = computed(() => {
    const term = q.value.toLowerCase()
    let rows = allRows.value.filter(r => !term || r.url.toLowerCase().includes(term))
    if (sort.value) {
      const { column, direction } = sort.value
      rows = rows.slice().sort((a: any, b: any) => {
        const va = a[column], vb = b[column]
        if (va < vb) return direction === 'asc' ? -1 : 1
        if (va > vb) return direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return rows
  })
  const filteredRows = computed(() => {
    const start = (page.value - 1) * pageCount
    return filteredAll.value.slice(start, start + pageCount)
  })

  // Derived phase based on DB state
  const hasSummary = computed(() => !!(auditFromDb.value as any)?.summary)
  const phase = computed<Phase>(() => {
    if (audit.status === 'analyzing') return 'analyzing'
    if (hasSummary.value) return 'insights'
    if (allRows.value.length > 0) return 'crawled'
    return 'start'
  })

  // Selection / expansion state
  const expanded = ref<Record<number, boolean>>({})
  const selectedIds = ref<string[]>([])
  const analyzedCount = computed(() => allRows.value.filter(r => r.status === 'analyzed').length)

  const UButtonC = resolveComponent('UButton')
  const UBadgeC = resolveComponent('UBadge')
  const columns: TableColumn<RowItem>[] = [
    { id: 'select', header: () => h('input', { type: 'checkbox', 'aria-label': 'Select shown', onChange: (e: any) => (e.target.checked ? selectAllShown() : clearSelection()) }),
      cell: ({ row }) => h('input', { type: 'checkbox', checked: selectedIds.value.includes(row.original.id), onChange: (e: any) => toggleSelected(row.original.id, e.target.checked) }) },
    { id: 'expand', cell: ({ row }) => h(UButtonC, { color: 'neutral', variant: 'ghost', icon: 'i-lucide-chevron-down', square: true, 'aria-label': 'Expand', ui: { leadingIcon: ['transition-transform', row.getIsExpanded() ? 'duration-200 rotate-180' : ''] }, onClick: () => row.toggleExpanded() }) },
    { accessorKey: 'url', header: 'URL', cell: ({ row }) => h('div', { class: 'truncate max-w-[520px]' }, row.getValue('url') as string) },
    { accessorKey: 'score', header: 'Score', cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [h(UBadgeC, { variant: 'soft', color: scoreColor(Number(row.getValue('score'))) as any }, () => String(row.getValue('score')))]) },
    { id: 'lh', header: 'Metrics', cell: ({ row }) => {
      const lh = row.original.lighthouse || {}
      const makeDot = (label: string, value?: number) => h('div', { class: 'relative group' }, [
        h('div', { class: `w-3 h-3 rounded-full ${dotColor(value)}`, 'aria-label': `${label} ${value ?? '-'}` }),
        h('div', {
          class: 'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-[var(--color-foreground)] px-1.5 py-0.5 text-[10px] text-[var(--color-background)] opacity-0 shadow transition-opacity group-hover:opacity-100'
        }, `${label} ${value ?? '-'}`)
      ])
      return h('div', { class: 'flex gap-1' }, [
        makeDot('Performance', lh.performance),
        makeDot('SEO', lh.seo),
        makeDot('Best practices', lh.bestPractices),
        makeDot('Accessibility', lh.accessibility)
      ])
    } },
    { accessorKey: 'aiReadiness', header: 'AI Ready', cell: ({ row }) => h(UBadgeC, { variant: 'soft', color: scoreColor(Number(row.original.aiReadiness || 0)) as any }, () => String(row.original.aiReadiness || 0)) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => h(UBadgeC, { variant: 'subtle', color: statusColor(row.getValue('status') as RowStatus) as any, class: 'capitalize' }, () => String(row.getValue('status'))) },
    { id: 'actions', header: '', cell: ({ row }) => h('div', { class: 'flex items-center gap-1' }, [ h(UButtonC, { size: 'xs', color: 'primary', variant: 'soft', icon: 'i-lucide-sparkles', onClick: () => analyzeRow(row.original) }, 'Analyze'), h(UButtonC, { size: 'xs', color: 'error', variant: 'ghost', icon: 'i-lucide-trash-2', onClick: () => removeRow(row.original) }) ]) }
  ]

  function statusColor(s: RowStatus) { switch (s) { case 'new': return 'neutral'; case 'crawled': return 'warning'; case 'analyzed': return 'success'; case 'error': return 'error' } }
  function scoreColor(score: number) { if (score >= 90) return 'success'; if (score >= 70) return 'warning'; return 'error' }
  function scoreLabel(score: number) { if (score >= 90) return 'Excellent'; if (score >= 70) return 'Good'; return 'Needs work' }
  function dotColor(score?: number) {
    if (typeof score !== 'number') return 'bg-[var(--color-neutral)]'
    if (score >= 90) return 'bg-[var(--color-success)]'
    if (score >= 50) return 'bg-[var(--color-warning)]'
    return 'bg-[var(--color-error)]'
  }

  function analyzeRow(row: RowItem) { row.status = 'analyzed' }
  async function analyzeSelected() {
    if (!audit.id) return
    // Persist analyzing state so UI reflects across navigation
    try { await $fetch(`/api/audits/${audit.id}`, { method: 'PATCH', body: { status: 'analyzing' } }); audit.status = 'analyzing' } catch {}
    // enqueue jobs
    await $fetch('/api/analysis/enqueue', { method: 'POST', body: { auditId: audit.id, pageIds: selectedIds.value } })
    // process a batch immediately (dev only). In prod the Nitro worker handles it.
    if (import.meta.dev) {
      await $fetch('/api/worker/process', { method: 'POST', body: { limit: selectedIds.value.length, workerId: 'ui-dev' } })
    }
    // refresh pages and audit summary
    await loadPages()
    await refreshAudit()
    if ((auditFromDb.value as any)?.summary) Object.assign(report, (auditFromDb.value as any).summary)
  }
  function toggleSelected(id: string, on?: boolean) { const idx = selectedIds.value.indexOf(id); if ((on ?? idx === -1)) { if (idx === -1) selectedIds.value.push(id) } else if (idx !== -1) { selectedIds.value.splice(idx, 1) } }
  function selectAllShown() { const ids = filteredRows.value.map(r => r.id); selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids])) }
  function clearSelection() { selectedIds.value = [] }
  function removeRow(row: RowItem) { allRows.value = allRows.value.filter(r => r.id !== row.id) }

  function exportCsv() { const headers = ['url','score','status']; const csv = [headers.join(',')].concat(allRows.value.map(r => `${r.url},${r.score},${r.status}`)).join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${route.params.slug}-audit.csv`; a.click() }
  function exportPdf() { alert('PDF export will be implemented with server rendering later.') }
  function onReCrawl() { alert('Re-crawl queued (dummy)') }
  async function startCrawl() {
    if (!audit.id) return
    submitting.value = true
    try {
      const { crawlId } = await $fetch('/api/crawl', { method: 'POST', body: { rootUrl: form.rootUrl, maxPages: form.maxPages, strategy: form.strategy, concurrency: form.concurrency, respectRobots: form.respectRobots } })
      // poll status
      let status = 'running'
      while (status === 'running') {
        const s = await $fetch<{ status: string }>(`/api/crawl/${crawlId}/status`)
        status = s.status
        if (status === 'running') await new Promise(r => setTimeout(r, 1000))
      }
      if (status !== 'done') throw new Error('crawl failed')
      await $fetch(`/api/audits/${audit.id}/from-crawl`, { method: 'POST', body: { crawlId } })
      await loadPages()
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  }

  const crawlMenu = computed(() => ([
    [{ label: 'Reset form', icon: 'i-heroicons-arrow-path-rounded-square', onSelect: () => Object.assign(form, { rootUrl: audit.target, maxPages: 50, strategy: 'sitemap+internal', concurrency: 4, respectRobots: true }) }],
    [{ label: 'Copy current URL', icon: 'i-heroicons-link', onSelect: () => navigator.clipboard?.writeText(form.rootUrl) }]
  ]))

  // Archive / delete actions for detail view
  const detailMenu = computed(() => ([
    [
      audit.status === 'archived'
        ? { label: 'Unarchive', icon: 'i-heroicons-archive-box', onSelect: () => unarchiveAudit() }
        : { label: 'Archive', icon: 'i-heroicons-archive-box', onSelect: () => archiveAudit() },
      { label: 'Delete…', icon: 'i-heroicons-trash', onSelect: () => (deleteOpen.value = true) },
    ],
  ]))

  const updating = ref(false)
  async function archiveAudit() {
    if (!audit.id || updating.value) return
    updating.value = true
    try {
      await $fetch(`/api/audits/${audit.id}`, { method: 'PATCH', body: { status: 'archived' } })
      audit.status = 'archived'
    } catch (e) { console.error(e) } finally { updating.value = false }
  }
  async function unarchiveAudit() {
    if (!audit.id || updating.value) return
    updating.value = true
    try {
      await $fetch(`/api/audits/${audit.id}`, { method: 'PATCH', body: { status: 'ready' } })
      audit.status = 'ready'
    } catch (e) { console.error(e) } finally { updating.value = false }
  }

  const deleteOpen = ref(false)
  const deleting = ref(false)
  const router = useRouter()
  async function performDelete() {
    if (!audit.id) return
    deleting.value = true
    try {
      await $fetch(`/api/audits/${audit.id}`, { method: 'DELETE' })
      deleteOpen.value = false
      router.push('/dashboard')
    } catch (e) { console.error(e) } finally { deleting.value = false }
  }
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active { transition: all .25s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(6px); }
</style>
