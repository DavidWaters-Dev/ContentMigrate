<template>
  <section class="py-24 relative overflow-hidden bg-[var(--color-background)]">
    <!-- Subtle background elements -->
    <div class="absolute inset-0 bg-gradient-to-br from-[var(--color-background-subtle)] to-[var(--color-background)] opacity-70"></div>
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
    
    <UContainer class="space-y-16 relative z-10">
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs border-[var(--color-border)] bg-[var(--color-background-subtle)] text-[var(--color-accent)]">
          <span class="i-lucide-help-circle text-[var(--color-accent)]" />
          Common questions
        </div>
        <h2 class="text-4xl md:text-5xl font-semibold tracking-tight">Frequently asked questions</h2>
        <p class="text-[var(--color-foreground-subtle)] max-w-2xl mx-auto text-lg">
          Everything you need to know about the SEO Auditor tool
        </p>
      </div>
     
      <UCard class="max-w-3xl mx-auto">
        <UAccordion :items="faqItems" class="divide-y divide-[var(--color-border)]" />
      </UCard>
       
      <div class="text-center space-y-4">
        <p class="text-[var(--color-foreground-subtle)]">Still have questions?</p>
        <UButton color="primary" variant="outline" to="/contact">
          Contact our support team
        </UButton>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
const faqItems = [
  {
    label: 'How does the SEO Auditor tool work?',
    content: 'Our tool crawls your website, analyzes each page using advanced AI algorithms, and provides actionable recommendations based on modern SEO best practices. It checks technical aspects, content quality, user experience factors, and more to give you a comprehensive view of your site\'s SEO health.',
    defaultOpen: true
  },
  {
    label: 'Do I need technical knowledge to use this tool?',
    content: 'Not at all! The SEO Auditor is designed to be user-friendly for everyone from beginners to experts. Our recommendations are clear and actionable, with step-by-step instructions for implementing fixes. For more complex issues, we provide detailed explanations to help you understand the underlying concepts.'
  },
  {
    label: 'How often should I run an SEO audit?',
    content: 'We recommend running a full audit at least once a month, and after any major website changes or updates. For larger websites, you might want to set up weekly scheduled audits to catch issues early. Our Pro and Enterprise plans include automated scheduled audits.'
  },
  {
    label: 'Can I audit my competitors\' websites?',
    content: 'You can audit any publicly accessible website. However, please note that some features may be limited for sites you don\'t own (such as detailed page speed analysis that requires server access). Our Enterprise plan includes specific competitor analysis features designed for benchmarking.'
  },
  {
    label: 'How is this different from other SEO tools?',
    content: 'Our SEO Auditor combines advanced AI analysis with practical, actionable recommendations. Unlike many tools that overwhelm you with data, we prioritize issues by impact and provide clear steps to fix them. We also focus on modern SEO factors like E-E-A-T, Core Web Vitals, and AI-readiness that many tools overlook.'
  },
  {
    label: 'Can I export the audit results?',
    content: 'Yes! All plans allow you to export your results in PDF format. The Pro and Enterprise plans also support CSV exports for data analysis and white-labeled reports you can share with clients or team members.'
  },
  {
    label: 'Is there a limit to how many pages I can audit?',
    content: 'The Free plan allows up to 5 pages per audit. The Pro plan increases this to 50 pages, which is sufficient for most small to medium websites. The Enterprise plan offers unlimited pages, making it ideal for large websites or agencies managing multiple clients.'
  }
]
</script>
