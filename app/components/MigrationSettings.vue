<template>
  <UCard class="space-y-5" variant="soft">
    <UFormField label="Save method" description="Prefer saving with browser folder picker for direct-to-disk writes">
      <div class="flex items-center gap-3">
        <USwitch v-model="s.clientSave" />
        <span class="text-sm">Save with browser file picker</span>
        <UButton v-if="s.clientSave" size="sm" icon="i-lucide-folder-open" @click="chooseFolder">Choose folder</UButton>
        <span v-if="folderName" class="text-xs text-[var(--color-foreground-subtle)]">{{ folderName }}</span>
      </div>
    </UFormField>
    

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
        <UCheckbox v-model="s.output.csv" label="CSV (index.csv)" />
      </div>
    </UFormField>

    <UFormField label="Images" description="Control browser-side image downloads">
      <div class="flex items-center gap-4 flex-wrap">
        <USwitch v-model="s.downloadImages" />
        <span class="text-sm">Download images</span>
        <div class="flex items-center gap-2">
          <UInput v-model.number="s.maxImagesPerPage" type="number" min="1" class="w-24" />
          <span class="text-xs text-[var(--color-foreground-subtle)]">Max images/page</span>
        </div>
        <div class="flex items-center gap-2">
          <UInput v-model.number="s.maxImageMB" type="number" min="1" class="w-24" />
          <span class="text-xs text-[var(--color-foreground-subtle)]">Max MB/image</span>
        </div>
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
  const folderHandle = ref<FileSystemDirectoryHandle | null>(null)
  const folderName = computed(() => folderHandle.value ? (folderHandle.value as any).name : '')
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
  async function chooseFolder() {
    try {
      // @ts-ignore
      const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker()
      try { await (handle as any).requestPermission?.({ mode: 'readwrite' }) } catch {}
      folderHandle.value = handle
      ;(window as any).__contentMigrateDirHandle = handle
    } catch {}
  }
</script>
