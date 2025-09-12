<template>
  <section v-if="site" class="space-y-6">
    <div class="flex flex-wrap gap-3">
      <ScoreBadge label="Health" :score="site.healthScore" />
      <ScoreBadge
        v-for="(v, k) in site.categoryScores"
        :key="k"
        :label="k"
        :score="v"
      />
    </div>
    <div>
      <h2 class="text-lg font-semibold mb-2">Top Opportunities</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <IssueCard
          v-for="i in topIssues"
          :key="i.id + '-top'"
          :issue="i"
        />
      </div>
    </div>
    <div>
      <h2 class="text-lg font-semibold mb-2">Issues</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <IssueCard
          v-for="i in site.consolidatedIssues"
          :key="i.id"
          :issue="i"
        />
      </div>
    </div>
    <ExportMenu :site="site" :pages="pages" />
  </section>
</template>

<script setup lang="ts">
  import IssueCard from "./IssueCard.vue";
  import ScoreBadge from "./ScoreBadge.vue";
  import ExportMenu from "./ExportMenu.vue";

  const store = useAuditStore();
  const site = store.site.value;
  const pages = store.pages.value;

  const severityWeight: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const topIssues = computed(() => {
    if (!site || !site.consolidatedIssues?.length) return [] as import('~/types').Issue[];
    return [...site.consolidatedIssues]
      .sort((a, b) => {
        const wA = severityWeight[a.severity] || 0;
        const wB = severityWeight[b.severity] || 0;
        const pa = a.pagesAffected?.length || 0;
        const pb = b.pagesAffected?.length || 0;
        if (wA !== wB) return wB - wA; // higher severity first
        if (pa !== pb) return pb - pa; // more affected pages first
        return a.summary.localeCompare(b.summary);
      })
      .slice(0, 4);
  });
</script>
