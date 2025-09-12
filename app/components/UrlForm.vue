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
        <div class="space-y-6 p-4 md:p-6 rounded border border-[var(--color-border)] bg-[var(--color-background-subtle)]">
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
            <UFormField label="Max pages" description="Try 50 for a quick pass">
              <UInput
                class="mt-2"
                size="lg"
                v-model.number="form.maxPages"
                type="number"
                min="1"
                max="200"
              />
            </UFormField>
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
    maxPages: 50,
    strategy: "sitemap+internal",
    concurrency: 2,
    respectRobots: true,
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
