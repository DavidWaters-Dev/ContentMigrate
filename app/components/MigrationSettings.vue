<template>
  <UCard class="space-y-5" variant="soft">
    <UAlert color="neutral" variant="soft" icon="i-lucide-info" title="Output location" :description="'Files are saved to your Downloads/contentmigrate folder under md/ and media/.'" />
    

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Main content selector" description="Optional CSS selector to extract (e.g. article)">
        <UInput v-model="s.selector" placeholder="article, main, #content" size="lg" />
      </UFormField>
      <UFormField label="Slug from" description="Use page path or AI title">
        <USelect
          v-model="s.slugStrategy"
          :items="[
            { label: 'Path', value: 'path' },
            { label: 'Title', value: 'title' },
          ]"
          size="lg"
        />
      </UFormField>
    </div>

    <UFormField label="Frontmatter fields" description="Add tags like date, image, youtubeID; press Enter to add">
      <UInputTags v-model="frontmatterTags" placeholder="e.g. date, image, youtubeID" />
    </UFormField>

    <UFormField label="Output formats">
      <div class="flex items-center gap-4">
        <UCheckbox v-model="s.output.md" label="Markdown (.md)" />
        <UCheckbox v-model="s.output.yml" label="YAML (.yml)" />
        <UCheckbox v-model="s.output.json" label="JSON (.json)" />
      </div>
      <p class="text-xs text-[var(--color-foreground-subtle)] mt-1">Outputs are written to your Downloads/contentmigrate folder under <code>Content/</code> and <code>media/</code>.</p>
    </UFormField>

    <UFormField label="Extra prompt context" description="Optional guidance to tailor extraction">
      <UTextarea v-model="s.additionalPrompt" :rows="4" placeholder="Only migrate the main <article> content..." />
    </UFormField>
  </UCard>
</template>

<script setup lang="ts">
  const migrate = useMigrateStore()
  const s = migrate.settings.value
  const frontmatterTags = computed<string[]>({
    get: () => (s.frontmatter || []).map(f => f.key),
    set: (arr: string[]) => {
      const seen = new Set<string>()
      const keys = (arr || [])
        .map(k => String(k || '').trim())
        .filter(Boolean)
        .filter(k => { const ok = !seen.has(k.toLowerCase()); seen.add(k.toLowerCase()); return ok })
      s.frontmatter = keys.map(k => ({ key: k }))
    }
  })

  // Server writes to Downloads/contentmigrate
</script>
