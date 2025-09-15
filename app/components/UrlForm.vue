<template>
  <!-- Sources (Patterns / Manual / CSV) -->
  <UCard variant="soft" class="p-4 md:p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Sources</h3>
        <p class="text-xs text-[var(--color-foreground-subtle)]">Add patterns, manual URLs or CSV to build a list without deep crawling.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-search" :loading="srcLoading" @click="onPreviewSources">Preview</UButton>
        <UButton color="neutral" variant="soft" :disabled="srcPreview.length===0" @click="onUseSources">Use now ({{ srcPreview.length }})</UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <UFormField label="Site origin" description="e.g., https://www.example.com">
        <UInput v-model="src.origin" placeholder="https://www.example.com" size="lg" />
      </UFormField>
      <UFormField label="Include patterns" description="/news/*, /blog/* (press Enter)">
        <UInputTags v-model="src.patterns" placeholder="/news/*, /blog/*" />
      </UFormField>
      <UFormField label="Exclude patterns" description="/tag, /category (press Enter)">
        <UInputTags v-model="src.excludes" placeholder="/tag, /category" />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UFormField label="Manual URLs" description="One URL per line">
        <UTextarea v-model="src.manual" :rows="6" placeholder="https://example.com/news/a\nhttps://example.com/news/b" />
      </UFormField>
      <UFormField label="CSV import" description="Upload a CSV with one URL per row">
        <input type="file" accept=".csv,text/csv" @change="onCsv" />
        <div v-if="src.csvCount" class="text-xs text-[var(--color-foreground-subtle)] mt-2">Loaded {{ src.csvCount }} URLs</div>
      </UFormField>
    </div>

    <UCard v-if="srcPreview.length" class="max-h-56 overflow-auto text-sm">
      <div v-for="u in srcPreview.slice(0, 200)" :key="u" class="truncate">{{ u }}</div>
      <div v-if="srcPreview.length>200" class="text-xs text-[var(--color-foreground-subtle)] mt-1">+ {{ srcPreview.length - 200 }} more…</div>
    </UCard>
  </UCard>
</template>

<script setup lang="ts">
  const store = useAuditStore();
  const submitting = ref(false);

  // Sources state
  const src = reactive({ origin: '', patterns: [] as string[], excludes: [] as string[], manual: '', csvCount: 0 })
  const srcPreview = ref<string[]>([])
  const srcLoading = ref(false)

  async function onCsv(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    src.csvCount = lines.length
    src.manual = [src.manual, ...lines].filter(Boolean).join('\n')
  }

  async function onPreviewSources() {
    srcLoading.value = true
    srcPreview.value = []
    try {
      let urls: string[] = []
      if (src.origin || src.patterns.length) {
        const res = await $fetch<{ urls: string[] }>("/api/sources/expand", { method: 'POST', body: { origin: src.origin, patterns: src.patterns, excludes: src.excludes } })
        urls = res.urls || []
      }
      const manual = src.manual.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      srcPreview.value = Array.from(new Set([...(urls || []), ...manual]))
    } catch (e:any) {
      store.status.value.error = e?.data?.statusMessage || e?.message || String(e)
    } finally {
      srcLoading.value = false
    }
  }

  function onUseSources() {
    if (!srcPreview.value.length) return
    store.rootUrl.value = src.origin || store.rootUrl.value
    store.status.value.discovered = [...srcPreview.value]
    store.status.value.running = false
  }
</script>
