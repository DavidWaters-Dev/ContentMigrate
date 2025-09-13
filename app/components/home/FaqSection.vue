<template>
  <section class="py-24 relative overflow-hidden bg-[var(--color-background)]">
    <!-- Subtle background elements -->
    <div class="absolute inset-0 bg-gradient-to-br from-[var(--color-background-subtle)] to-[var(--color-background)] opacity-70"></div>
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
    
    <UContainer class="space-y-16 relative z-10">
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs border-[var(--color-border)] bg-[var(--color-background-subtle)] text-[var(--color-accent)]">
          <span class="i-lucide-help-circle text-[var(--color-accent)]" />
          Common questions
        </div>
        <h2 class="text-4xl md:text-5xl font-semibold tracking-tight">Frequently asked questions</h2>
        <p class="text-[var(--color-foreground-subtle)] max-w-2xl mx-auto text-lg">
          Everything you need to know about migrating content to Nuxt Content
        </p>
      </div>
     
      <UCard class="max-w-3xl mx-auto">
        <UAccordion :items="faqItems" class="divide-y divide-[var(--color-border)]" />
      </UCard>
       
      <div class="text-center space-y-4">
        <p class="text-[var(--color-foreground-subtle)]">Still have questions?</p>
        <UButton color="primary" variant="outline" to="/contact">
          Contact our support team
        </UButton>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
const faqItems = [
  {
    label: 'How does the Content Migrator work?',
    content: 'Enter a site URL and start a crawl. Select the pages you want, then configure frontmatter, content and media folders, and an optional CSS selector. The tool uses AI to convert the selected content into Markdown with local images and writes files to your project.',
    defaultOpen: true
  },
  {
    label: 'Do I need technical knowledge to use this tool?',
    content: 'No. The UI guides you through crawl, selection, and conversion. You can optionally provide a CSS selector (e.g., \'article\') to target main content. The output works out-of-the-box with Nuxt Content.'
  },
  {
    label: 'Can I customize frontmatter?',
    content: 'Yes. Add any frontmatter keys you need (title, date, mainImage, sortOrder, etc.). You can set defaults and the AI will populate values where possible. The tool also records the source URL.'
  },
  {
    label: 'Where do images go?',
    content: 'Images are downloaded into your chosen media folder under a page-specific subfolder (e.g., public/images/news/<slug>/). Markdown image references are rewritten to local paths.'
  },
  {
    label: 'Does it overwrite existing files?',
    content: 'If a filename already exists, the tool will overwrite it. For safety, use a dedicated content subfolder when migrating and review changes in version control.'
  },
  {
    label: 'Is there a limit on pages?',
    content: 'You can set a max page cap during crawl and choose specific pages to migrate. For team usage, we recommend enabling quotas and concurrency limits (optional Supabase integration) — ask us if you need help.'
  }
]
</script>
