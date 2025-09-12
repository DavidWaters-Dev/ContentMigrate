<template>
  <UCard class="h-full">
    <template #header>
      <div class="flex justify-between items-start">
        <h3 class="font-semibold text-white">{{ issue.summary }}</h3>
        <UBadge :color="severityColor" size="sm" class="capitalize">{{
          issue.severity
        }}</UBadge>
      </div>
    </template>
    <p class="text-sm text-zinc-400">{{ issue.rationale }}</p>
    <ul class="list-disc ml-6 mt-3 space-y-1">
      <li v-for="step in issue.fixSteps" :key="step" class="text-sm text-zinc-300">
        {{ step }}
      </li>
    </ul>
    <div v-if="issue.snippet" class="mt-3 space-y-2">
      <pre
        class="bg-zinc-800 text-zinc-100 p-2 text-xs rounded overflow-x-auto"
      >{{ issue.snippet.code }}</pre>
      <UButton
        size="xs"
        icon="i-heroicons-clipboard"
        @click="copy(issue.snippet.code)"
        >Copy snippet</UButton
      >
    </div>
    <div v-if="issue.pagesAffected?.length" class="mt-3">
      <div class="text-xs font-medium text-zinc-400 mb-1">Affected URLs</div>
      <ul class="text-xs text-blue-400 underline space-y-1 break-all">
        <li v-for="url in issue.pagesAffected" :key="url">
          <a :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
        </li>
      </ul>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  import type { Issue } from "~/types";
  const props = defineProps<{ issue: Issue }>();

  const severityColor = computed(() => {
    const level = props.issue.severity?.toLowerCase();
    if (level === "critical") return "error";
    if (level === "high") return "warning";
    if (level === "medium") return "info";
    if (level === "low") return "neutral";
    return "success";
  });

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>
