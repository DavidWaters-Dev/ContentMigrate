<template>
  <UContainer class="py-16 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Migration Jobs</h1>
      <div class="flex items-center gap-2">
        <USelect v-model="status" :items="statusOptions" size="md" />
        <UButton icon="i-lucide-rotate-cw" color="neutral" @click="refresh" :loading="loading">Refresh</UButton>
      </div>
    </div>

    <UCard>
      <div class="overflow-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-[var(--color-foreground-subtle)]">
            <tr>
              <th class="p-2">ID</th>
              <th class="p-2">Status</th>
              <th class="p-2">Planned</th>
              <th class="p-2">OK</th>
              <th class="p-2">Errors</th>
              <th class="p-2">Created</th>
              <th class="p-2">Updated</th>
              <th class="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="j in jobs" :key="j.id" class="border-t">
              <td class="p-2 font-mono">{{ shortId(j.id) }}</td>
              <td class="p-2"><UBadge :color="colorFor(j.status)" variant="soft" :label="j.status" /></td>
              <td class="p-2">{{ j.planned ?? '—' }}</td>
              <td class="p-2">{{ j.ok ?? 0 }}</td>
              <td class="p-2">{{ j.errorCount ?? 0 }}</td>
              <td class="p-2">{{ fmt(j.createdAt) }}</td>
              <td class="p-2">{{ fmt(j.updatedAt) }}</td>
              <td class="p-2">
                <UButton size="xs" color="neutral" variant="ghost" :to="`/jobs/${j.id}`">View</UButton>
              </td>
            </tr>
            <tr v-if="!loading && jobs.length === 0">
              <td class="p-2 text-[var(--color-foreground-subtle)]" colspan="8">No jobs</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
  const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Queued', value: 'queued' },
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' },
  ]
  const status = ref('')
  const jobs = ref<any[]>([])
  const loading = ref(false)
  function shortId(id: string) { return id?.slice(0, 8) }
  function fmt(d: string) { try { return new Date(d).toLocaleString() } catch { return d } }
  function colorFor(s: string) {
    if (s === 'completed') return 'success'
    if (s === 'failed') return 'error'
    if (s === 'processing') return 'primary'
    return 'neutral'
  }
  async function refresh() {
    loading.value = true
    try {
      const q = status.value ? `?status=${encodeURIComponent(status.value)}` : ''
      const res = await $fetch<{ jobs: any[] }>(`/api/migrate/jobs${q}`)
      jobs.value = res.jobs || []
    } finally {
      loading.value = false
    }
  }
  watch(status, refresh)
  onMounted(refresh)
</script>

