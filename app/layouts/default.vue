<template>
  <div
    class="min-h-dvh flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]"
  >
    <!-- Subtle gradient background with grid pattern -->
    <div
      class="fixed inset-0 opacity-50 z-0 bg-gradient-to-b from-[var(--color-background)] to-[var(--color-background-subtle)]"
    ></div>
    <div
      class="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] z-0"
    ></div>

    <header
      class="sticky top-0 z-20 border-b backdrop-blur bg-[var(--color-background)]/80 border-[var(--color-border)]"
    >
      <UContainer class="flex items-center justify-between h-16">
        <div class="flex items-center gap-4">
          <div class="text-base font-black tracking-tight">CONTENTMigrate</div>
        </div>
        <div class="flex items-center gap-3">
          <UButton to="/migrate" color="primary" variant="ghost"
            >Start Migration</UButton
          >
          <UButton to="/jobs" color="neutral" variant="ghost">Jobs</UButton>
          <UButton
            variant="ghost"
            color="neutral"
            :icon="modeIcon"
            @click="toggleColorMode"
            :aria-label="`Switch to ${nextMode} mode`"
          />
          3033
        </div>
      </UContainer>
    </header>

    <main class="flex-1 relative z-10">
      <slot />
    </main>

    <footer class="border-t py-10 relative z-10 border-[var(--color-border)]">
      <UContainer
        class="text-xs text-[var(--color-foreground-subtle)] flex items-center justify-between"
      >
        <div>© {{ new Date().getFullYear() }} {{ appName }}</div>
        <div class="flex items-center gap-4">
          <ULink to="#" class="hover:text-[var(--color-accent)]">Privacy</ULink>
          <ULink to="#" class="hover:text-[var(--color-accent)]">Terms</ULink>
        </div>
      </UContainer>
    </footer>
  </div>
</template>

<script setup lang="ts">
  const config = useRuntimeConfig();
  const appName = config.public.appName || "Content Migrator";
  const colorMode = useColorMode();
  const nextMode = computed(() =>
    colorMode.value === "dark" ? "light" : "dark"
  );
  const modeIcon = computed(() =>
    colorMode.value === "dark" ? "i-heroicons-sun" : "i-heroicons-moon"
  );
  function toggleColorMode() {
    colorMode.preference = nextMode.value;
  }
</script>
