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
        <h2 class="text-4xl md:text-5xl font-semibold tracking-tight">Powerful features for serious SEO</h2>
        <p class="text-[var(--color-foreground-subtle)] max-w-2xl mx-auto text-lg">
          Everything you need to analyze, optimize, and monitor your website's search performance
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
    title: 'Intelligent Crawling',
    icon: 'i-lucide-globe',
    description: 'Scan your entire website efficiently with our smart crawler.',
    points: [
      'Respects robots.txt and sitemap.xml',
      'Configurable crawl depth and speed',
      'Handles JavaScript-rendered content',
      'Detects duplicate content issues'
    ]
  },
  {
    title: 'AI-Powered Analysis',
    icon: 'i-lucide-brain',
    description: 'Get insights from our advanced AI that understands SEO context.',
    points: [
      'Content quality assessment',
      'Keyword optimization suggestions',
      'Competitive gap analysis',
      'Prioritized action items'
    ]
  },
  {
    title: 'Technical SEO Audit',
    icon: 'i-lucide-settings',
    description: 'Identify and fix technical issues affecting your rankings.',
    points: [
      'Core Web Vitals analysis',
      'Schema markup validation',
      'Mobile-friendliness checks',
      'Broken link detection'
    ]
  },
  {
    title: 'Content Optimization',
    icon: 'i-lucide-file-text',
    description: 'Improve your content for both users and search engines.',
    points: [
      'Readability analysis',
      'E-E-A-T assessment',
      'Semantic relevance scoring',
      'Title and meta optimization'
    ]
  },
  {
    title: 'Performance Metrics',
    icon: 'i-lucide-gauge',
    description: 'Monitor and improve your site speed and user experience.',
    points: [
      'Page load time analysis',
      'Core Web Vitals monitoring',
      'Mobile performance testing',
      'Resource optimization tips'
    ]
  },
  {
    title: 'Actionable Reports',
    icon: 'i-lucide-bar-chart',
    description: 'Get clear, actionable reports you can share with your team.',
    points: [
      'Exportable PDF reports',
      'Priority-based recommendations',
      'Before/after comparisons',
      'Executive summaries'
    ]
  }
]
</script>
