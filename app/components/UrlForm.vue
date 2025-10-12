<template>
  <div class="space-y-8">
    <div class="grid gap-8 xl:grid-cols-[3fr,2fr]">
      <UCard variant="soft" class="p-0 overflow-hidden">
        <div
          class="px-8 py-6 border-b border-zinc-200/80 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.85),rgba(255,255,255,0.6))]"
        >
          <div
            class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="space-y-3">
              <span
                class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700/90 bg-blue-50 px-3 py-1 rounded-full"
              >
                <span class="i-lucide-rocket text-blue-600" />
                Step 1 · Discovery
              </span>
              <div class="space-y-2">
                <h3 class="text-3xl font-semibold">
                  Curate the sources you want to migrate
                </h3>
                <p
                  class="text-sm text-[var(--color-foreground-subtle)] max-w-2xl"
                >
                  Set the context for our crawler, add any must-have URLs, and
                  review a deduplicated preview before moving into page
                  selection.
                </p>
              </div>
            </div>
            <div
              class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-[var(--color-foreground-subtle)]"
            >
              <div class="flex items-start gap-3">
                <span class="i-lucide-compass text-blue-600 mt-0.5" />
                <div>
                  <p
                    class="text-xs font-medium uppercase tracking-wide text-blue-600/80"
                  >
                    Focus
                  </p>
                  <p>
                    Use an origin and include patterns to target the right
                    sections.
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="i-lucide-list-plus text-blue-600 mt-0.5" />
                <div>
                  <p
                    class="text-xs font-medium uppercase tracking-wide text-blue-600/80"
                  >
                    Curate
                  </p>
                  <p>
                    Paste must-migrate URLs or import them from your
                    spreadsheet.
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="i-lucide-sparkles text-blue-600 mt-0.5" />
                <div>
                  <p
                    class="text-xs font-medium uppercase tracking-wide text-blue-600/80"
                  >
                    Preview
                  </p>
                  <p>Review a clean list before moving into selection.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-8 space-y-10">
          <section class="space-y-5">
            <header class="flex items-start gap-3">
              <div
                class="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
              >
                <span class="i-lucide-map-pin" />
              </div>
              <div>
                <h4
                  class="text-base font-semibold text-[var(--color-foreground)]"
                >
                  Tell us where to look
                </h4>
                <p class="text-sm text-[var(--color-foreground-subtle)]">
                  Use the origin to seed crawling and focus it with include or
                  exclude patterns.
                </p>
              </div>
            </header>
            <div class="grid grid-cols-1 xl:grid-cols-6 gap-6">
              <UFormField
                label="Site origin"
                description="e.g., https://www.example.com"
                class="xl:col-span-6"
              >
                <UInput
                  v-model="src.origin"
                  placeholder="https://www.example.com"
                  size="lg"
                />
              </UFormField>
              <UFormField
                label="Include patterns"
                description="/news/*, /blog/* (press Enter)"
                class="xl:col-span-3"
              >
                <UInputTags
                  v-model="src.patterns"
                  placeholder="/news/*, /blog/*"
                />
              </UFormField>
              <UFormField
                label="Exclude patterns"
                description="/tag, /category (press Enter)"
                class="xl:col-span-3"
              >
                <UInputTags
                  v-model="src.excludes"
                  placeholder="/tag, /category"
                />
              </UFormField>
            </div>
          </section>

          <section class="space-y-5">
            <header class="flex items-start gap-3">
              <div
                class="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
              >
                <span class="i-lucide-file-plus-2" />
              </div>
              <div>
                <h4
                  class="text-base font-semibold text-[var(--color-foreground)]"
                >
                  Layer in any specific URLs
                </h4>
                <p class="text-sm text-[var(--color-foreground-subtle)]">
                  Paste URLs directly or upload a CSV. We&rsquo;ll dedupe them
                  automatically.
                </p>
              </div>
            </header>
            <div
              class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr),1fr] gap-6 items-start"
            >
              <div class="space-y-3">
                <UFormField label="Manual URLs" description="One URL per line">
                  <UTextarea
                    v-model="src.manual"
                    :rows="8"
                    placeholder="https://example.com/news/a&#10;https://example.com/news/b"
                  />
                </UFormField>
                <div
                  class="flex items-center justify-between text-xs text-[var(--color-foreground-subtle)]"
                >
                  <span
                    >{{ manualCount }}
                    {{ manualCount === 1 ? "entry" : "entries" }} captured</span
                  >
                  <span>Press Enter to add a new line</span>
                </div>
              </div>
              <UFormField
                label="CSV import"
                description="Upload a CSV with one URL per row"
              >
                <div
                  class="flex flex-col gap-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-5 text-sm text-[var(--color-foreground-subtle)] transition-colors"
                >
                  <div class="space-y-1">
                    <p class="font-medium text-[var(--color-foreground)]">
                      Drop a file here or browse
                    </p>
                    <p class="text-xs">Accepted: .csv</p>
                  </div>
                  <label
                    class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white text-sm font-medium text-blue-600 border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <span class="i-lucide-upload" />
                    <span>Browse CSV</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      class="hidden"
                      @change="onCsv"
                    />
                  </label>
                  <div
                    v-if="src.csvCount"
                    class="text-xs text-[var(--color-foreground-subtle)]"
                  >
                    Loaded {{ src.csvCount }}
                    {{ src.csvCount === 1 ? "URL" : "URLs" }} from CSV
                  </div>
                </div>
              </UFormField>
            </div>
          </section>

          <section class="space-y-5">
            <header class="flex items-start gap-3">
              <div
                class="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
              >
                <span class="i-lucide-list-checks" />
              </div>
              <div>
                <h4
                  class="text-base font-semibold text-[var(--color-foreground)]"
                >
                  Preview and move forward
                </h4>
                <p class="text-sm text-[var(--color-foreground-subtle)]">
                  Generate a quick preview to confirm everything looks right,
                  then send it to page selection.
                </p>
              </div>
            </header>
            <div class="space-y-4">
              <UAlert
                v-if="!canPreview"
                color="neutral"
                icon="i-lucide-info"
                title="Add a source first"
                description="Provide an origin, include pattern, or manual URLs to enable preview."
                variant="soft"
              />

              <div class="flex flex-wrap items-center gap-3" v-else>
                <UButton
                  color="primary"
                  variant="solid"
                  size="lg"
                  icon="i-lucide-rotate-cw"
                  :loading="srcLoading"
                  @click="onPreviewSources"
                >
                  {{ srcPreview.length ? "Refresh preview" : "Preview list" }}
                </UButton>
                <UButton
                  v-if="srcPreview.length"
                  icon="i-lucide-check"
                  :disabled="srcLoading"
                  @click="onUseSources"
                >
                  Use for selection ({{ srcPreview.length }})
                </UButton>
                <span
                  v-else
                  class="text-xs text-[var(--color-foreground-subtle)]"
                  >We&rsquo;ll show up to 200 URLs from your inputs.</span
                >
              </div>

              <UCard v-if="srcPreview.length" class="p-0 overflow-hidden">
                <header
                  class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50"
                >
                  <div>
                    <p
                      class="text-sm font-medium text-[var(--color-foreground)]"
                    >
                      Preview ({{ srcPreview.length }})
                    </p>
                    <p class="text-xs text-[var(--color-foreground-subtle)]">
                      Showing the first 200 URLs
                    </p>
                  </div>
                  <UButton
                    size="lg"
                    variant="solid"
                    icon="i-lucide-rotate-cw"
                    :loading="srcLoading"
                    @click="onPreviewSources"
                  >
                    Refresh
                  </UButton>
                </header>
                <div class="max-h-72 overflow-auto text-sm px-4 py-3 space-y-1">
                  <div
                    v-for="u in srcPreview.slice(0, 200)"
                    :key="u"
                    class="truncate text-[var(--color-foreground)]"
                  >
                    {{ u }}
                  </div>
                  <div
                    v-if="srcPreview.length > 200"
                    class="text-xs text-[var(--color-foreground-subtle)]"
                  >
                    + {{ srcPreview.length - 200 }} more…
                  </div>
                </div>
              </UCard>

              <div
                v-else-if="canPreview"
                class="rounded-lg border border-dashed border-zinc-200 bg-white/40 px-4 py-3 text-sm text-[var(--color-foreground-subtle)]"
              >
                Preview is ready to generate. Hit
                <span class="font-medium text-[var(--color-foreground)]"
                  >Preview list</span
                >
                to see a deduplicated list before moving on.
              </div>
            </div>
          </section>
        </div>
      </UCard>

      <div class="space-y-6 lg:sticky lg:top-6 self-start">
        <UCard variant="soft" class="p-6 space-y-5">
          <div class="flex items-start gap-3">
            <span class="i-lucide-flag text-blue-600 mt-0.5" />
            <div class="space-y-2">
              <span
                class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700/90"
              >
                {{ readyState.label }}
              </span>
              <p class="text-sm text-[var(--color-foreground-subtle)]">
                {{ readyState.description }}
              </p>
            </div>
          </div>
          <div
            class="grid grid-cols-2 gap-3 text-xs text-[var(--color-foreground-subtle)]"
          >
            <div class="rounded-lg border border-zinc-200/70 bg-white/40 p-3">
              <p class="text-[0.65rem] uppercase tracking-wide">Origin</p>
              <p
                class="mt-1 text-sm font-medium text-[var(--color-foreground)]"
              >
                {{ originDisplay }}
              </p>
            </div>
            <div class="rounded-lg border border-zinc-200/70 bg-white/40 p-3">
              <p class="text-[0.65rem] uppercase tracking-wide">
                Include patterns
              </p>
              <p
                class="mt-1 text-sm font-medium text-[var(--color-foreground)]"
              >
                {{ src.patterns.length }}
              </p>
            </div>
            <div class="rounded-lg border border-zinc-200/70 bg-white/40 p-3">
              <p class="text-[0.65rem] uppercase tracking-wide">
                Exclude patterns
              </p>
              <p
                class="mt-1 text-sm font-medium text-[var(--color-foreground)]"
              >
                {{ src.excludes.length }}
              </p>
            </div>
            <div class="rounded-lg border border-zinc-200/70 bg-white/40 p-3">
              <p class="text-[0.65rem] uppercase tracking-wide">
                Manual entries
              </p>
              <p
                class="mt-1 text-sm font-medium text-[var(--color-foreground)]"
              >
                {{ manualCount }}
              </p>
            </div>
            <div
              class="rounded-lg border border-zinc-200/70 bg-white/40 p-3 col-span-2"
            >
              <p class="text-[0.65rem] uppercase tracking-wide">CSV import</p>
              <p
                class="mt-1 text-sm font-medium text-[var(--color-foreground)]"
              >
                {{ src.csvCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard variant="soft" class="p-6 space-y-4">
          <h4 class="text-sm font-semibold text-[var(--color-foreground)]">
            Helpful reminders
          </h4>
          <ul class="space-y-3 text-sm text-[var(--color-foreground-subtle)]">
            <li class="flex gap-3">
              <span class="i-lucide-target text-blue-500 mt-0.5" />
              <span
                >Use include patterns like
                <code class="font-mono text-xs bg-blue-50 px-1.5 py-0.5 rounded"
                  >/resources/*</code
                >
                to focus on sections.</span
              >
            </li>
            <li class="flex gap-3">
              <span class="i-lucide-layers text-blue-500 mt-0.5" />
              <span
                >Mix manual entries with CSV uploads—the preview keeps
                everything deduplicated.</span
              >
            </li>
            <li class="flex gap-3">
              <span class="i-lucide-shield-check text-blue-500 mt-0.5" />
              <span
                >Make sure sensitive or private areas are excluded before you
                preview.</span
              >
            </li>
          </ul>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const store = useAuditStore();

  // Sources state
  const src = reactive({
    origin: "",
    patterns: [] as string[],
    excludes: [] as string[],
    manual: "",
    csvCount: 0,
  });
  const srcPreview = ref<string[]>([]);
  const srcLoading = ref(false);

  const manualEntries = computed(() =>
    src.manual
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
  const manualCount = computed(() => manualEntries.value.length);
  const canPreview = computed(() => {
    return (
      Boolean(src.origin.trim()) ||
      src.patterns.length > 0 ||
      src.excludes.length > 0 ||
      manualCount.value > 0 ||
      src.csvCount > 0
    );
  });
  const originDisplay = computed(() => {
    if (!src.origin) return "Not set";
    try {
      const url = new URL(src.origin);
      return url.hostname || src.origin;
    } catch (error) {
      return src.origin;
    }
  });
  const readyState = computed(() => {
    if (srcLoading.value) {
      return {
        label: "Generating preview",
        description:
          "Give us a moment while we expand your patterns and deduplicate URLs.",
      };
    }
    if (srcPreview.value.length) {
      return {
        label: "Preview ready",
        description: `Preview generated with ${srcPreview.value.length} ${srcPreview.value.length === 1 ? "URL" : "URLs"}. Use it to move into selection.`,
      };
    }
    if (canPreview.value) {
      return {
        label: "Ready to preview",
        description:
          'Hit "Preview list" to generate a deduplicated collection you can send to selection.',
      };
    }
    return {
      label: "Add inputs",
      description:
        "Add an origin, include patterns, or paste manual URLs to begin building your list.",
    };
  });

  async function onCsv(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    src.csvCount = lines.length;
    src.manual = [src.manual, ...lines].filter(Boolean).join("\n");
  }

  async function onPreviewSources() {
    if (!canPreview.value) return;
    srcLoading.value = true;
    srcPreview.value = [];
    try {
      let urls: string[] = [];
      if (src.origin || src.patterns.length) {
        const res = await $fetch<{ urls: string[] }>("/api/sources/expand", {
          method: "POST",
          body: {
            origin: src.origin,
            patterns: src.patterns,
            excludes: src.excludes,
          },
        });
        urls = res.urls || [];
      }
      const manual = manualEntries.value;
      srcPreview.value = Array.from(new Set([...(urls || []), ...manual]));
    } catch (e: any) {
      store.status.value.error =
        e?.data?.statusMessage || e?.message || String(e);
    } finally {
      srcLoading.value = false;
    }
  }

  function onUseSources() {
    if (!srcPreview.value.length) return;
    store.rootUrl.value = src.origin || store.rootUrl.value;
    store.status.value.discovered = [...srcPreview.value];
    store.status.value.running = false;
  }
</script>
