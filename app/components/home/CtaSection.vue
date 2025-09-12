<template>
  <section class="py-24 relative overflow-hidden bg-[var(--color-background-subtle)]">
    <!-- Decorative elements -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
    <div class="absolute top-0 left-0 w-full h-full" :style="accentRadial"></div>
    <div class="absolute bottom-0 right-0 w-full h-full" :style="accentRadialAlt"></div>

    <UContainer class="relative z-10">
      <div class="max-w-4xl mx-auto text-center space-y-8">
        <h2 class="text-4xl md:text-5xl font-semibold tracking-tight">
          Ready to improve your search rankings?
        </h2>
        <p class="text-lg md:text-xl text-[var(--color-foreground-subtle)] max-w-2xl mx-auto">
          Start with a free audit today and discover how your website can
          perform better in search results
        </p>

        <div class="pt-6">
          <UButton size="xl" to="/dashboard" color="primary" class="font-medium border-0">
            Start free audit
            <template #trailing>
              <span class="i-lucide-arrow-right"></span>
            </template>
          </UButton>
        </div>

        <p class="text-sm text-[var(--color-foreground-subtle)] pt-2">
          No credit card required • Results in minutes • 100% free to try
        </p>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
  const accentRadial = computed(() => ({
    background:
      'radial-gradient(circle at top right, ' +
      'color-mix(in_oklab, var(--color-accent) 15%, transparent) 0%, transparent 50%)'
  }))
  const accentRadialAlt = computed(() => ({
    background:
      'radial-gradient(circle at bottom left, ' +
      'color-mix(in_oklab, var(--color-accent) 15%, transparent) 0%, transparent 50%)'
  }))
</script>
