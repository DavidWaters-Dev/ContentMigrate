<template>
  <UContainer class="py-16 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Job {{ shortId(id) }}</h1>
        <p class="text-sm text-[var(--color-foreground-subtle)]">Status: <span class="font-medium">{{ status?.status }}</span></p>
      </div>
      <div class="flex items-center gap-2">
        <UButton v-if="status?.status==='queued'" icon="i-lucide-square" color="error" variant="soft" @click="cancel" :loading="loading">Cancel</UButton>
        <UButton icon="i-lucide-rotate-cw" color="neutral" @click="refresh" :loading="loading">Refresh</UButton>
      </div>
    </div>

    <UCard>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><div class="text-[var(--color-foreground-subtle)]">Created</div><div>{{ fmt(status?.createdAt) || '—' }}</div></div>
        <div><div class="text-[var(--color-foreground-subtle)]">Updated</div><div>{{ fmt(status?.updatedAt) || '—' }}</div></div>
        <div><div class="text-[var(--color-foreground-subtle)]">Pages OK</div><div>{{ okCount }}</div></div>
        <div><div class="text-[var(--color-foreground-subtle)]">Errors</div><div>{{ errorCount }}</div></div>
      </div>
    </UCard>

    <UCard>
      <div class="font-semibold mb-2">Logs</div>
      <div class="text-xs max-h-64 overflow-auto bg-[var(--color-background-subtle)] rounded p-2">
        <div v-for="(l, idx) in (status?.logs || [])" :key="idx">{{ l }}</div>
      </div>
    </UCard>

    <UCard v-if="Array.isArray(status?.results?.results)">
      <div class="font-semibold mb-2">Pages</div>
      <div class="overflow-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-[var(--color-foreground-subtle)]">
            <tr>
              <th class="p-2">URL</th>
              <th class="p-2">Slug</th>
              <th class="p-2">Status</th>
              <th class="p-2">Images</th>
              <th class="p-2">.md</th>
              <th class="p-2">.yml</th>
              <th class="p-2">.json</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r,index) in status.results.results" :key="index" class="border-t">
              <td class="p-2 break-all"><a :href="r.url" target="_blank" class="text-blue-700 underline">{{ r.url }}</a></td>
              <td class="p-2 font-mono">{{ r.slug || '—' }}</td>
              <td class="p-2"><UBadge :color="r.status==='ok'?'success':(r.status==='error'?'error':'neutral')" variant="soft" :label="r.status" /></td>
              <td class="p-2">{{ r.imagesSaved ?? 0 }}</td>
              <td class="p-2 font-mono">{{ r.mdPath || '—' }}</td>
              <td class="p-2 font-mono">{{ r.ymlPath || '—' }}</td>
              <td class="p-2 font-mono">{{ r.jsonPath || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
  const route = useRoute()
  const id = route.params.id as string
  const status = ref<any>(null)
  const loading = ref(false)

  const okCount = computed(() => Array.isArray(status.value?.results?.results) ? status.value.results.results.filter((r:any)=>r.status==='ok').length : 0)
  const errorCount = computed(() => Array.isArray(status.value?.results?.results) ? status.value.results.results.filter((r:any)=>r.status==='error').length : 0)

  function shortId(v: string) { return v?.slice(0,8) }
  function fmt(d?: string) { try { return d ? new Date(d).toLocaleString() : '' } catch { return d || '' } }

  async function refresh() {
    loading.value = true
    try {
      status.value = await $fetch(`/api/migrate/jobs/${id}/status`)
    } finally {
      loading.value = false
    }
  }

  async function cancel() {
    loading.value = true
    try {
      await $fetch(`/api/migrate/jobs/${id}`, { method: 'PATCH', body: { action: 'cancel' } })
      await refresh()
    } finally {
      loading.value = false
    }
  }

  onMounted(refresh)
</script>
