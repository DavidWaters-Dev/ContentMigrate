<template>
  <section id="video-demo" class="py-24 relative overflow-hidden bg-[var(--color-background)]">
    <!-- Decorative elements -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
    <div
      class="absolute top-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"
    ></div>

    <UContainer class="relative z-10 space-y-12">
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs border-[var(--color-border)] bg-[var(--color-background-subtle)] text-[var(--color-accent)]">
          <span class="i-lucide-play text-[var(--color-accent)]" />
          Watch the demo
        </div>
        <h2 class="text-4xl md:text-5xl font-semibold tracking-tight">
          See the migrator in action
        </h2>
        <p class="text-[var(--color-foreground-subtle)] max-w-2xl mx-auto text-lg">
          Watch how the tool crawls a site and converts content into Markdown and local images ready for Nuxt Content.
        </p>
      </div>

      <UCard class="max-w-4xl mx-auto overflow-hidden">
        <div class="aspect-video">
          <!-- YouTube embed (only loaded after clicking play) -->
          <div class="w-full h-full">
            <ScriptYouTubePlayer videoId="IY2d1g8IidU" />
          </div>
        </div>
      </UCard>

      <div class="text-center space-y-4">
        <p class="text-[var(--color-foreground-subtle)]">Ready to try it on your own website?</p>
        <UButton size="lg" to="/migrate" color="primary" class="border-0">
          Start migration now
        </UButton>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts"></script>
