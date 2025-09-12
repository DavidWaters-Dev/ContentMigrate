<template>
  <div v-if="status.running" class="p-4 border rounded">
    <div class="flex items-center gap-2">
      <span class="i-lucide-loader-2 animate-spin" />
      <p class="font-semibold">Crawling in progress…</p>
    </div>
    <p class="text-sm text-zinc-600 mt-1">
      Discovering pages and fetching HTML. This may take a moment depending on site size.
    </p>
    <p class="mt-2">
      Discovered: {{ status.discovered.length }} | Fetched: {{ status.fetched.length }}
    </p>
    <div
      v-if="logs.length"
      class="mt-2 max-h-40 overflow-auto text-xs bg-gray-50 p-2 rounded"
      aria-live="polite"
    >
      <div v-for="(line, idx) in logs" :key="idx">{{ line }}</div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
  const store = useAuditStore();
  const status = store.status;
  const logs = store.crawlLogs;

  if (store.crawlId.value) {
    const id = store.crawlId.value;
    const interval = setInterval(async () => {
      const res = await $fetch(`/api/crawl/${id}/status`);
      status.value.discovered = res.discovered;
      status.value.fetched = res.fetched;
      if (res.logs) logs.value = res.logs;
      if (res.status !== "running") {
        status.value.running = false;
        clearInterval(interval);
      }
      // Guard optional error property to satisfy TS
      if ((res as any)?.error) status.value.error = (res as any).error as string;
    }, 1000);
  }
</script>
