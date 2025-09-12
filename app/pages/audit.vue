<template>
  // Old audit page replaced with new dashboard at /dashboard but kept for
  reference and ability to repurpose within codex's refactoring workflow.
  <UContainer class="py-24 space-y-10">
    <!-- Hero -->
    <section class="text-center space-y-4">
      <div
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 text-xs text-zinc-600"
      >
        <span class="i-lucide-sparkles" />
        AI-powered technical + on-page insights
      </div>
      <h1
        class="text-6xl md:text-7xl max-w-2xl mx-auto font-semibold tracking-tight"
      >
        Audit your site
      </h1>
      <p class="text-zinc-600 max-w-2xl mx-auto">
        Crawl your website, analyze structure and content with AI, and get a
        prioritized list of SEO issues and opportunities.
      </p>
    </section>

    <!-- Inline Steps UI -->
    <div class="space-y-6">
      <!-- 1) Start -->
      <section v-if="step === 'start'" class="space-y-6">
        <UrlForm @started="() => {}" />
      </section>

      <!-- 2) Identifying URLs -->
      <section v-else-if="step === 'identify'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Identifying URLs</h2>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            @click="resetAll"
          >
            Restart
          </UButton>
        </div>

        <p class="text-sm text-zinc-600">
          Select which pages to include in the analysis.
        </p>

        <UCard>
          <div class="overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-left text-zinc-600">
                <tr>
                  <th class="p-2 w-10">
                    <UCheckbox
                      :model-value="allSelected"
                      @update:model-value="toggleAll"
                      aria-label="Select all"
                    />
                  </th>
                  <th class="p-2">URL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="url in urlsForSelection" :key="url" class="border-t">
                  <td class="p-2 align-top">
                    <UCheckbox
                      :model-value="includedSet.has(url)"
                      @update:model-value="(v) => toggleOne(url, v)"
                      :aria-label="`Select ${url}`"
                    />
                  </td>
                  <td class="p-2">
                    <a
                      :href="url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-700 underline break-all"
                      >{{ url }}</a
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <div class="flex items-center gap-3">
          <UButton
            :disabled="includedUrls.length === 0"
            :loading="analyzing"
            icon="i-lucide-brain"
            @click="runAnalysis"
          >
            Analyze selected pages ({{ includedUrls.length }})
          </UButton>
          <span class="text-sm text-zinc-500" v-if="analyzing"
            >Analyzing pages…</span
          >
        </div>

        <!-- No crawl logs here; logs are only visible while crawling -->
      </section>

      <!-- 3) Analyzing -->
      <section v-else-if="step === 'analyzing'" class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="i-lucide-loader-2 animate-spin" />
          <h2 class="text-lg font-semibold">Analyzing selected pages…</h2>
        </div>
        <p class="text-sm text-zinc-600">
          Running AI analysis on the selected pages. This can take a few
          minutes.
        </p>
        <UCard
          v-if="analysisLogs.length"
          class="text-sm whitespace-pre-wrap max-h-60 overflow-auto"
          aria-live="polite"
        >
          <div class="font-semibold mb-1">Analysis Logs</div>
          <div>
            <div v-for="(line, idx) in analysisLogs" :key="idx">{{ line }}</div>
          </div>
        </UCard>
      </section>
    </div>

    <!-- Steps integrated into the form header -->

    <!-- Form / Progress / Actions (kept for crawl state and errors) -->
    <section class="space-y-6">
      <UAlert
        v-if="status.error"
        color="error"
        icon="i-lucide-alert-triangle"
        title="Something went wrong"
        :description="status.error"
        variant="soft"
      />

      <CrawlProgress v-if="status.running" />

      <!-- Analysis action moved into Identify step -->
    </section>

    <!-- 4) Report -->
    <section v-if="step === 'report'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Analysis Report</h2>
        <UButton color="neutral" icon="i-lucide-rotate-ccw" @click="resetAll"
          >Clear & Restart</UButton
        >
      </div>
      <ResultDashboard />
    </section>

    <!-- FAQ/Tips -->
    <section class="pt-6 border-t border-zinc-300/90">
      <h2 class="text-lg font-medium mb-3">Tips</h2>
      <ul class="text-sm text-zinc-600 space-y-2 list-disc pl-5">
        <li>Use a smaller max pages first to validate your setup.</li>
        <li>Respect robots.txt to avoid crawling disallowed areas.</li>
        <li>Combine sitemap + internal for broader coverage.</li>
      </ul>
    </section>
  </UContainer>
</template>

<script setup lang="ts">
  import UrlForm from "~/components/UrlForm.vue";
  import CrawlProgress from "~/components/CrawlProgress.vue";
  import ResultDashboard from "~/components/ResultDashboard.vue";

  const store = useAuditStore();
  const { status, crawlId, site, pages, analyzing, crawlLogs, analysisLogs } =
    store;
  const crawlDone = computed(
    () => !status.value.running && status.value.fetched.length > 0
  );

  // Step machine: start -> identify -> analyzing -> report
  const step = computed<"start" | "identify" | "analyzing" | "report">(() => {
    if (site.value) return "report";
    if (analyzing.value) return "analyzing";
    if (crawlDone.value) return "identify";
    return "start";
  });

  // URL selection state (defaults to all fetched when crawl completes)
  const includedUrls = ref<string[]>([]);
  const includedSet = computed(() => new Set(includedUrls.value));
  const urlsForSelection = computed(() => status.value.fetched as string[]);
  const allSelected = computed(
    () =>
      urlsForSelection.value.length > 0 &&
      includedUrls.value.length === urlsForSelection.value.length
  );

  watch(crawlDone, (done) => {
    if (done) {
      includedUrls.value = [...status.value.fetched];
    } else if (!status.value.running) {
      // reset if starting over
      includedUrls.value = [];
    }
  });

  function toggleAll(value: boolean | "indeterminate") {
    if (value === true) includedUrls.value = [...urlsForSelection.value];
    else if (value === false) includedUrls.value = [];
  }

  function toggleOne(url: string, value: boolean | "indeterminate") {
    const next = new Set(includedUrls.value);
    if (value === true) next.add(url);
    else if (value === false) next.delete(url);
    includedUrls.value = [...next];
  }

  function resetAll() {
    crawlId.value = null;
    pages.value = [];
    site.value = null;
    crawlLogs.value = [];
    analysisLogs.value = [];
    status.value.running = false;
    status.value.discovered = [];
    status.value.fetched = [];
    status.value.error = "";
    includedUrls.value = [];
  }

  async function runAnalysis() {
    if (!crawlId.value) return;
    if (status.value.fetched.length === 0) {
      status.value.error = "No pages fetched. Check crawl logs above.";
      return;
    }
    try {
      analyzing.value = true;
      const res = await $fetch("/api/analyze", {
        method: "POST",
        body: { crawlId: crawlId.value, includedUrls: includedUrls.value },
      });
      pages.value = res.pages;
      site.value = res.site;
      analysisLogs.value = res.logs || [];
    } catch (e: any) {
      status.value.error = e.data?.statusMessage || e.message;
      analysisLogs.value.push(`Error: ${status.value.error}`);
    } finally {
      analyzing.value = false;
    }
  }

  // Modal component rendered at root of page for processing feedback
</script>
