<template>
  <UForm class="space-y-6" @submit.prevent="onSubmit" :state="form">
    <UCard variant="soft" class="p-4 md:p-6">
      <!-- Prominent URL input -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <UInput
            v-model="form.rootUrl"
            placeholder="https://example.com"
            icon="i-lucide-globe"
            required
            size="xl"
            class="w-full"
          />
        </div>
        <UButton
          type="submit"
          :disabled="submitting"
          icon="i-lucide-rocket"
          size="xl"
          class="px-6"
        >
          Start
        </UButton>
      </div>
      <p class="text-xs text-[var(--color-foreground-subtle)] mt-2">
        We'll only crawl within this origin.
      </p>
    </UCard>
    <UAccordion
      class="px-6"
      :items="[
        {
          label: 'Advanced Options',
          icon: 'i-lucide-settings',
          defaultOpen: false,
          slot: 'advanced',
        },
      ]"
      variant="soft"
    >
      <template #advanced>
        <div
          class="space-y-6 p-4 md:p-6 rounded border border-[var(--color-border)] bg-[var(--color-background-subtle)]"
        >
          <!-- First row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField
              label="Strategy"
              description="Sitemap is safest and reads /sitemap.xml; internal follows links within domain"
            >
              <USelect
                size="lg"
                v-model="form.strategy"
                :items="strategies"
                class="mt-2"
              />
            </UFormField>
            <div class="text-sm text-[var(--color-foreground-subtle)] mt-8">
              The crawl is polite and bounded by internal safeguards.
            </div>
          </div>

          <!-- Second row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField
              label="Concurrency"
              help="Capped at 2 to avoid overloading servers."
              description="Controls parallel fetches; server enforces a cap of 2."
            >
              <UInput
                size="lg"
                class="mt-2"
                v-model.number="form.concurrency"
                type="number"
                min="1"
                max="2"
              />
            </UFormField>
            <UFormField
              label="Respect robots.txt"
              description="Follow robots.txt rules"
            >
              <USwitch
                unchecked-icon="i-lucide-x"
                checked-icon="i-lucide-check"
                class="mt-2"
                size="lg"
                v-model="form.respectRobots"
              />
            </UFormField>
          </div>

          <!-- Path filters -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField
              label="Include paths"
              description="Only crawl URLs whose path starts with any of these (e.g. /news, /blog) (Press Enter after each entry)"
            >
              <UInputTags
                v-model="form.includePrefixes"
                placeholder="/news, /blog"
              />
            </UFormField>
            <UFormField
              label="Exclude paths"
              description="Skip URLs whose path starts with any of these (e.g. /wp-admin, /tag)"
            >
              <UInputTags
                v-model="form.excludePrefixes"
                placeholder="/wp-admin, /tag"
              />
            </UFormField>
          </div>
        </div>
      </template>
    </UAccordion>
  </UForm>
</template>

<script setup lang="ts">
  const emit = defineEmits(["started"]);
  const store = useAuditStore();
  const submitting = ref(false);
  const form = reactive({
    rootUrl: "",
    strategy: "sitemap+internal",
    concurrency: 2,
    respectRobots: true,
    includePrefixes: [] as string[],
    excludePrefixes: [] as string[],
  });
  const strategies = [
    { label: "Sitemap only", value: "sitemap-only" },
    { label: "Sitemap + internal", value: "sitemap+internal" },
  ];

  async function onSubmit() {
    submitting.value = true;
    store.rootUrl.value = form.rootUrl;
    store.crawlLogs.value = [];
    try {
      const { crawlId } = await $fetch("/api/crawl", {
        method: "POST",
        body: form,
      });
      store.crawlId.value = crawlId;
      store.status.value.running = true;
      store.status.value.error = "";
      emit("started", crawlId);
    } catch (e: any) {
      store.status.value.error = e.data?.statusMessage || e.message;
      store.crawlLogs.value.push(
        `Crawl start error: ${store.status.value.error}`
      );
    } finally {
      submitting.value = false;
    }
  }
</script>
