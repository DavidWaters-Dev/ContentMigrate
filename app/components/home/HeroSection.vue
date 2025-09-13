<template>
  <section class="relative overflow-hidden py-24 md:py-36 lg:py-40 bg-[var(--color-background)]">
    <!-- Background elements (theme-aware) -->
    <div class="absolute inset-0 bg-gradient-to-br from-[var(--color-background)] via-[var(--color-background-subtle)] to-[var(--color-background)]"></div>

    <!-- Glowing accent in corner -->
    <div class="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl bg-[color-mix(in_oklab,var(--color-accent)_20%,transparent)]"></div>
    <div class="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)]"></div>

    <!-- Decorative grid with subtle styling for dark mode -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

    <UContainer class="relative">
      <div class="max-w-3xl mx-auto text-center space-y-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs border-[var(--color-border)] bg-[var(--color-background-subtle)] text-[var(--color-accent)]">
          <span class="i-lucide-sparkles text-[var(--color-accent)]" />
          AI-powered content migration
        </div>

        <h1 class="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
          <span class="block mb-2">Streamline your</span>
          <span class="gradient-text">content migration</span>
        </h1>

        <p class="text-[var(--color-foreground-subtle)] max-w-2xl mx-auto text-lg">
          Crawl a site, select pages, and convert to clean Markdown with local images and customizable frontmatter.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <UButton size="xl" color="primary" to="/migrate" class="font-medium">
            Start migration
            <template #trailing>
              <span class="i-lucide-arrow-right"></span>
            </template>
          </UButton>

          <UButton size="xl" color="neutral" variant="outline" class="font-medium" @click="scrollToDemo">
            See how it works
            <template #trailing>
              <span class="i-lucide-play"></span>
            </template>
          </UButton>
        </div>

        <p class="text-sm text-[var(--color-foreground-subtle)] pt-4">
          No credit card required • Results in minutes • 100% free to try
        </p>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
  const scrollToDemo = () => {
    const demoSection = document.getElementById("video-demo");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };
</script>
