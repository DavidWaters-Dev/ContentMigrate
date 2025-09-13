<template>
  <div class="min-h-screen">
    <!-- Main content -->
    <main>
      <!-- Hero Section -->
      <HeroSection />

      <!-- Features Section -->
      <FeaturesSection />

      <!-- Pain Points Section -->
      <PainPointsSection />

      <!-- Video Demo Section -->
      <VideoSection />

      <!-- Pricing Section -->
      <PricingSection />

      <!-- Testimonials Section -->
      <TestimonialsSection />

      <!-- FAQ Section -->
      <FaqSection />

      <!-- CTA Section -->
      <CtaSection />
    </main>

    <!-- Sticky CTA - appears when scrolling -->
    <div
      v-show="showStickyCta"
      class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg py-4 transform transition-transform duration-300 z-50"
      :class="{
        'translate-y-0': showStickyCta,
        'translate-y-full': !showStickyCta,
      }"
    >
      <UContainer>
        <div class="flex items-center justify-between">
          <div class="hidden md:block">
            <h3 class="font-semibold">Ready to migrate your content?</h3>
            <p class="text-sm text-gray-600">Start converting pages to Markdown</p>
          </div>
          <UButton color="primary" size="lg" to="/migrate" class="ml-auto">
            Start migration
            <template #trailing>
              <span class="i-lucide-arrow-right"></span>
            </template>
          </UButton>
        </div>
      </UContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from "vue";
  import HeroSection from "~/components/home/HeroSection.vue";
  import FeaturesSection from "~/components/home/FeaturesSection.vue";
  import PainPointsSection from "~/components/home/PainPointsSection.vue";
  import VideoSection from "~/components/home/VideoSection.vue";
  import PricingSection from "~/components/home/PricingSection.vue";
  import TestimonialsSection from "~/components/home/TestimonialsSection.vue";
  import FaqSection from "~/components/home/FaqSection.vue";
  import CtaSection from "~/components/home/CtaSection.vue";

  // SEO metadata
  useHead({
    title: "Content Migrator - Convert sites to Nuxt Content",
    meta: [
      {
        name: "description",
        content:
          "Crawl a site, select pages, and convert to clean Markdown for Nuxt Content with local images and configurable frontmatter.",
      },
      {
        name: "keywords",
        content:
          "content migration, nuxt content, markdown, website scraper, ai migration",
      },
    ],
  });

  // Sticky CTA logic
  const showStickyCta = ref(false);

  const handleScroll = () => {
    // Show sticky CTA after scrolling 60% down the hero section
    showStickyCta.value = window.scrollY > window.innerHeight * 0.6;
  };

  onMounted(() => {
    window.addEventListener("scroll", handleScroll);
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
</script>
