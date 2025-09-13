<template>
  <section class="py-24 relative overflow-hidden bg-[var(--color-background-subtle)]">
    <!-- Subtle gradient accents -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"></div>
    
    <UContainer class="space-y-16 relative">
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-accent)]">
          <span class="i-lucide-heart text-[var(--color-accent)]" />
          Customer testimonials
        </div>
        <h2 class="text-4xl md:text-5xl font-semibold tracking-tight">
          Trusted by content teams
        </h2>
        <p class="text-[var(--color-foreground-subtle)] max-w-2xl mx-auto text-lg">
          See how teams streamline website migrations into Nuxt Content
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <UCard
          v-for="(testimonial, index) in testimonials"
          :key="index"
          class="transition-all border-[var(--color-border)] hover:border-[var(--color-accent)]"
        >
          <div class="flex items-center gap-2 mb-4">
            <div
              v-for="i in 5"
              :key="i"
              :class="[
                i <= testimonial.stars ? 'text-yellow-400' : 'text-zinc-700',
                'i-lucide-star-filled',
              ]"
            ></div>
          </div>

          <blockquote class="mb-6">
            "{{ testimonial.quote }}"
          </blockquote>

          <div class="flex items-center">
            <div class="h-10 w-10 rounded-full overflow-hidden mr-3 border border-[var(--color-border)] bg-[var(--color-background-subtle)]">
              <NuxtImg
                v-if="testimonial.avatar"
                :src="testimonial.avatar"
                :alt="testimonial.name"
                class="h-full w-full object-cover"
              />
              <span
                v-else
                class="flex h-full w-full items-center justify-center bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium text-sm"
              >
                {{ testimonial.name.charAt(0) }}
              </span>
            </div>
            <div>
              <div class="font-medium">
                {{ testimonial.name }}
              </div>
              <div class="text-sm text-[var(--color-foreground-subtle)]">{{ testimonial.role }}</div>
            </div>
          </div>
        </UCard>
      </div>

      <div class="flex flex-wrap justify-center gap-10 items-center opacity-40 py-6">
        <div v-for="(logo, index) in companyLogos" :key="index" class="h-8 invert">
          <NuxtImg :src="logo.src" :alt="logo.name" class="h-full" />
        </div>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Head of Content @ TechCorp',
      stars: 5,
      quote:
        'We migrated ~200 pages from Squarespace to Nuxt Content in a weekend. Markdown quality was excellent and images mapped perfectly.',
      avatar: '/images/testimonials/sarah.jpg'
    },
    {
      name: 'Michael Chen',
      role: 'Engineering Manager',
      stars: 5,
      quote:
        'The selector + frontmatter controls were spot on. Our team saved days of manual copy/paste and cleanup.',
      avatar: '/images/testimonials/michael.jpg'
    },
    {
      name: 'Emma Rodriguez',
      role: 'E‑commerce Lead',
      stars: 4,
      quote:
        'Loved the image handling and local paths. It made reviewing changes in Git incredibly clear.',
      avatar: ''
    },
    {
      name: 'David Wilson',
      role: 'Agency Founder',
      stars: 5,
      quote:
        'We run client migrations with consistent results. The converted badge tracking is a nice touch for QA.',
      avatar: '/images/testimonials/david.jpg'
    },
    {
      name: 'Jessica Taylor',
      role: 'Content Strategist',
      stars: 5,
      quote:
        'Frontmatter config let us fit our existing content model with zero refactors. Huge time saver.',
      avatar: ''
    },
    {
      name: 'Robert Kim',
      role: 'Full‑stack Developer',
      stars: 4,
      quote:
        'Simple setup, clean output. The Markdown was production ready without heavy manual edits.',
      avatar: '/images/testimonials/robert.jpg'
    }
  ];

  const companyLogos = [
    { name: "TechCorp", src: "/images/logos/techcorp.svg" },
    { name: "MediaGroup", src: "/images/logos/mediagroup.svg" },
    { name: "RetailGiant", src: "/images/logos/retailgiant.svg" },
    { name: "AgencyPartners", src: "/images/logos/agencypartners.svg" },
    { name: "StartupInc", src: "/images/logos/startupinc.svg" },
  ];
</script>
