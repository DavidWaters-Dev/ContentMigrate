<template>
  <section class="py-24 relative overflow-hidden bg-[var(--color-background-subtle)]">
    <!-- Subtle background pattern -->
    <div
      class="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
    ></div>
    <!-- Gradient accent -->
    <div
      class="absolute top-1/2 -translate-y-1/2 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
    ></div>

    <UContainer class="space-y-16 relative z-10">
      <div class="text-center space-y-4">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-accent)]"
        >
          <span class="i-lucide-zap text-blue-400" />
          Actionable insights
        </div>
        <h2 class="text-4xl md:text-5xl font-semibold tracking-tight">
          Solve your biggest SEO challenges
        </h2>
        <p class="text-[var(--color-foreground-subtle)] max-w-2xl mx-auto text-lg">
          Stop guessing what's holding back your rankings and start fixing the
          real issues
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div
          v-for="(item, index) in painPoints"
          :key="index"
          class="flex gap-6"
        >
          <div class="flex-shrink-0">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center text-[var(--color-accent)] border border-[var(--color-border)] bg-[var(--color-accent-subtle)]"
            >
              <span :class="item.icon"></span>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-3">
              {{ item.problem }}
            </h3>
            <p class="text-[var(--color-foreground-subtle)] mb-4">{{ item.description }}</p>
            <div class="flex items-center">
              <span class="text-sm font-medium text-[var(--color-accent)]"
                >Our solution:</span
              >
              <span class="ml-2 text-sm">{{
                item.solution
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <UCard class="max-w-3xl mx-auto border-[var(--color-border)]">
        <div class="flex flex-col md:flex-row items-center gap-8">
          <div class="md:w-1/4 flex justify-center">
            <span class="i-lucide-lightbulb text-6xl text-[var(--color-accent)]"></span>
          </div>
          <div class="md:w-3/4">
            <h3 class="text-2xl font-semibold mb-3">
              Stop losing traffic to competitors
            </h3>
            <p class="text-[var(--color-foreground-subtle)] mb-6">
              Most websites have hidden SEO issues that are costing them
              valuable traffic and revenue. Our AI-powered audit tool finds
              these issues and gives you a clear plan to fix them.
            </p>
            <UButton
              color="primary"
              size="lg"
              to="/dashboard"
              class="border-0"
            >
              Start your free audit
            </UButton>
          </div>
        </div>
      </UCard>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
  const painPoints = [
    {
      problem: "Invisible technical issues",
      description:
        "Hidden problems like slow page speed, broken links, and crawl errors can silently damage your rankings.",
      solution: "Comprehensive technical audit with prioritized fixes",
      icon: "i-lucide-bug",
    },
    {
      problem: "Content not ranking well",
      description:
        "Creating content that doesn't match search intent or lacks proper optimization wastes resources.",
      solution: "AI content analysis with actionable improvement tips",
      icon: "i-lucide-file-question",
    },
    {
      problem: "Confusing SEO data",
      description:
        "Too many tools showing different metrics makes it hard to know what to focus on first.",
      solution: "Clear, prioritized recommendations with impact scores",
      icon: "i-lucide-bar-chart-3",
    },
    {
      problem: "Keeping up with algorithm changes",
      description:
        "Google's constant updates make it difficult to stay current with best practices.",
      solution: "Always-updated analysis based on latest SEO standards",
      icon: "i-lucide-refresh-cw",
    },
  ];
</script>
