<template>
  <UCard class="space-y-5" variant="soft">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Content folder" description="Where to save Markdown files (relative to repo)">
        <UInput v-model="s.contentDir" placeholder="content/news" size="lg" />
      </UFormField>
      <UFormField label="Media folder" description="Where to save images (e.g. public/images/news)">
        <UInput v-model="s.mediaDir" placeholder="public/images/news" size="lg" />
      </UFormField>
    </div>

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

    <UFormField label="Frontmatter fields" description="Add keys to populate in frontmatter">
      <div class="flex flex-wrap items-center gap-2">
        <UTag v-for="(f, idx) in s.frontmatter" :key="f.key + idx" :label="f.key" color="neutral" variant="subtle">
          <template #trailing>
            <UButton size="2xs" icon="i-lucide-x" color="neutral" variant="ghost" @click="removeField(idx)" />
          </template>
        </UTag>
      </div>
      <div class="flex items-center gap-2 mt-2">
        <UInput v-model="newField" placeholder="e.g. date" size="lg" />
        <UButton icon="i-lucide-plus" @click="addField" :disabled="!newField.trim()">Add</UButton>
      </div>
    </UFormField>

    <UFormField label="Output formats">
      <div class="flex items-center gap-4">
        <UCheckbox v-model="s.output.md" label="Markdown (.md)" />
        <UCheckbox v-model="s.output.yml" label="YAML (.yml)" />
        <UCheckbox v-model="s.output.json" label="JSON (.json)" />
      </div>
    </UFormField>

    <UFormField label="Extra prompt context" description="Optional guidance to tailor extraction">
      <UTextarea v-model="s.additionalPrompt" :rows="4" placeholder="Only migrate the main <article> content..." />
    </UFormField>
  </UCard>
</template>

<script setup lang="ts">
  const migrate = useMigrateStore()
  const s = migrate.settings.value
  const newField = ref('')
  function addField() {
    const k = newField.value.trim()
    if (!k) return
    if (!s.frontmatter.find(f => f.key === k)) s.frontmatter.push({ key: k })
    newField.value = ''
  }
  function removeField(idx: number) {
    s.frontmatter.splice(idx, 1)
  }
</script>

