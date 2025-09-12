<template>
  <div class="flex gap-2">
    <UButton size="sm" @click="exportFile('markdown')">Export MD</UButton>
    <UButton size="sm" @click="exportFile('csv')">Export CSV</UButton>
  </div>
</template>

<script setup lang="ts">
import type { SiteSummary, PageAudit } from '~/types'

const props = defineProps<{ site: SiteSummary; pages: PageAudit[] }>()

async function exportFile (format: 'markdown' | 'csv') {
  const { filename, content } = await $fetch('/api/report', {
    method: 'POST',
    body: { site: props.site, pages: props.pages, format }
  })
  const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
</script>
