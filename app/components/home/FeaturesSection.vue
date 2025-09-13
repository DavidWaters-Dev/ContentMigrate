<template>
  <section class="py-24 relative overflow-hidden bg-[var(--color-background)]">
    <!-- Decorative elements -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.05),transparent_50%)]">
    </div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.05),transparent_50%)]">
    </div>
    
    <UContainer class="space-y-16 relative z-10">
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs border-[var(--color-border)] bg-[var(--color-background-subtle)] text-[var(--color-accent)]">
          <span class="i-lucide-layers text-[var(--color-accent)]" />
          Comprehensive toolset
        </div>
        <h2 class="text-4xl md:text-5xl font-semibold tracking-tight">Powerful features for fast migration</h2>
        <p class="text-[var(--color-foreground-subtle)] max-w-2xl mx-auto text-lg">
          Everything you need to crawl, select, and convert site content into clean Markdown for Nuxt Content
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <UCard
          v-for="feature in features" 
          :key="feature.title"
          class="group transition-all duration-300 border-[var(--color-border)] hover:border-[var(--color-accent)]"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 flex items-center justify-center rounded-lg text-[var(--color-accent)] border border-[var(--color-border)] bg-[var(--color-accent-subtle)] group-hover:border-[var(--color-accent)] transition-colors">
              <span :class="[feature.icon, 'text-2xl']"></span>
            </div>
            <h3 class="text-xl font-semibold">{{ feature.title }}</h3>
          </div>
          <p class="text-[var(--color-foreground-subtle)] mb-4">{{ feature.description }}</p>
          <ul class="space-y-2">
            <li v-for="(point, idx) in feature.points" :key="idx" class="flex items-start">
              <span class="i-lucide-check text-emerald-500 mr-2 mt-1 flex-shrink-0"></span>
              <span class="text-sm">{{ point }}</span>
            </li>
          </ul>
        </UCard>
      </div>
      
      <div class="text-center">
        <UButton color="primary" variant="outline" size="lg" to="/features">
          View all features
          <template #trailing>
            <span class="i-lucide-arrow-right"></span>
          </template>
        </UButton>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    title: 'Smart Crawling',
    icon: 'i-lucide-globe',
    description: 'Discover pages via sitemap or internal links with polite defaults.',
    points: [
      'Respects robots.txt and sitemap.xml',
      'Configurable page cap and concurrency',
      'Internal link extraction',
      'Blocklist via robots rules'
    ]
  },
  {
    title: 'AI Markdown Conversion',
    icon: 'i-lucide-brain',
    description: 'Generate clean Markdown for Nuxt Content with optional selector guidance.',
    points: [
      'Frontmatter extraction and mapping',
      'Article-only extraction (e.g., <article>)',
      'Slug suggestions',
      'Structured output consistency'
    ]
  },
  {
    title: 'Image Handling',
    icon: 'i-lucide-image',
    description: 'Download, organize, and rewrite image URLs to local paths.',
    points: [
      'Saves to public/images/.../<slug>/',
      'Rewrites Markdown image references',
      'Auto-set main image when missing',
      'Avoids duplicates per page run'
    ]
  },
  {
    title: 'Configurable Frontmatter',
    icon: 'i-lucide-sliders-horizontal',
    description: 'Define frontmatter keys (date, mainImage, sortOrder, etc.) and defaults.',
    points: [
      'Add/remove keys quickly',
      'Apply defaults per migration',
      'Source URL recorded',
      'Exports YAML/JSON sidecars'
    ]
  },
  {
    title: 'Local Progress Tracking',
    icon: 'i-lucide-badge-check',
    description: 'LocalStorage records converted pages for quick visual feedback.',
    points: [
      '“Converted” badge per URL',
      'Resume friendly',
      'No server DB required',
      'Lightweight and fast'
    ]
  },
  {
    title: 'Safe Defaults',
    icon: 'i-lucide-shield-check',
    description: 'Built-in caps and politeness to keep migrations reliable.',
    points: [
      'Concurrency caps during crawl',
      'Optional quotas (Supabase)',
      'Per-request timeouts',
      'Graceful error handling'
    ]
  }
]
</script>
