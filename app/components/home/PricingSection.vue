<template>
  <section class="py-24 relative overflow-hidden bg-[var(--color-background)]">
    <!-- Decorative elements -->
    <div
      class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]"
    ></div>
    <div
      class="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"
    ></div>

    <UContainer class="relative z-10">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">
          Simple, transparent pricing
        </h2>
        <p class="text-lg text-[var(--color-foreground-subtle)] max-w-2xl mx-auto">
          Choose the plan that's right for your business needs
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Free Tier -->
        <div class="rounded-xl border shadow-md overflow-hidden transition-all border-[var(--color-border)] hover:border-[var(--color-accent)]">
          <div class="p-6">
            <h3 class="text-lg font-semibold">Free</h3>
            <div class="mt-4 flex items-baseline">
              <span class="text-4xl font-bold tracking-tight"
                >$0</span
              >
              <span class="ml-1 text-sm font-medium text-[var(--color-foreground-subtle)]">/month</span>
            </div>
            <p class="mt-2 text-sm text-[var(--color-foreground-subtle)]">
              Perfect for trying out the platform
            </p>

            <ul class="mt-6 space-y-3">
              <li class="flex gap-2"><span class="i-lucide-check text-green-400 flex-shrink-0"></span><span class="text-sm">5 pages per migration</span></li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300"
                  >Basic technical analysis</span
                >
              </li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300">On-page SEO checks</span>
              </li>
              <li class="flex gap-2"><span class="i-lucide-check text-green-400 flex-shrink-0"></span><span class="text-sm text-zinc-300">1 migration batch per day</span></li>
            </ul>
          </div>
          <div class="px-6 py-4 border-t border-[var(--color-border)]">
            <UButton block color="primary" to="/migrate">
              Start for free
            </UButton>
          </div>
        </div>

        <!-- Pro Tier -->
        <div class="rounded-xl border-2 overflow-hidden relative scale-105 z-10 border-[var(--color-accent)]">
          <div
            class="absolute top-0 inset-x-0 bg-[var(--color-accent)] text-white text-xs font-medium text-center py-1"
          >
            MOST POPULAR
          </div>
          <div class="p-6 pt-8">
            <h3 class="text-lg font-semibold">Pro</h3>
            <div class="mt-4 flex items-baseline">
              <span class="text-4xl font-bold tracking-tight"
                >$49</span
              >
              <span class="ml-1 text-sm font-medium text-[var(--color-foreground-subtle)]">/month</span>
            </div>
            <p class="mt-2 text-sm text-[var(--color-foreground-subtle)]">
              For growing websites and businesses
            </p>

            <ul class="mt-6 space-y-3">
              <li class="flex gap-2"><span class="i-lucide-check text-green-400 flex-shrink-0"></span><span class="text-sm text-zinc-300">50 pages per migration</span></li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300"
                  >Advanced technical analysis</span
                >
              </li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300">Content optimization</span>
              </li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300">Competitor analysis</span>
              </li>
              <li class="flex gap-2"><span class="i-lucide-check text-green-400 flex-shrink-0"></span><span class="text-sm text-zinc-300">Priority worker queue</span></li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300">Email reports</span>
              </li>
            </ul>
          </div>
          <div class="px-6 py-4 border-t border-[var(--color-border)]">
            <UButton
              block
              color="primary"
              to="/pricing"
            >
              Get started
            </UButton>
          </div>
        </div>

        <!-- Enterprise Tier -->
        <div class="rounded-xl border shadow-md overflow-hidden transition-all border-[var(--color-border)] hover:border-[var(--color-accent)]">
          <div class="p-6">
            <h3 class="text-lg font-semibold">Enterprise</h3>
            <div class="mt-4 flex items-baseline">
              <span class="text-4xl font-bold tracking-tight"
                >$199</span
              >
              <span class="ml-1 text-sm font-medium text-[var(--color-foreground-subtle)]">/month</span>
            </div>
            <p class="mt-2 text-sm text-[var(--color-foreground-subtle)]">
              For large sites and agencies
            </p>

            <ul class="mt-6 space-y-3">
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300">Unlimited pages</span>
              </li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300"
                  >Enterprise-grade analysis</span
                >
              </li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300"
                  >AI content optimization</span
                >
              </li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300">Multi-site management</span>
              </li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300">API access</span>
              </li>
              <li class="flex gap-2">
                <span
                  class="i-lucide-check text-green-400 flex-shrink-0"
                ></span>
                <span class="text-sm text-zinc-300">Dedicated support</span>
              </li>
            </ul>
          </div>
          <div class="px-6 py-4 border-t border-[var(--color-border)]">
            <UButton
              block
              color="primary"
              to="/contact"
            >
              Contact sales
            </UButton>
          </div>
        </div>
      </div>

      <div class="mt-12 text-center text-sm text-[var(--color-foreground-subtle)]">
        All plans include a 14-day money-back guarantee. No questions asked.
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
  // No additional script needed
</script>
