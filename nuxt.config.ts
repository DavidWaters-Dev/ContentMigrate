import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  routeRules: {
  '/dashboard': {
    appMiddleware: ['auth-logged-in'],
    kinde: {
      redirectUrl: '/api/login',
      external: true,
    },
  }
},

supabase: {
    redirect: false, // Disables automatic redirection handling
  },

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {
      appName: 'AI SEO Auditor'
    }
  },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@nuxtjs/kinde',
    '@nuxtjs/supabase'
  ],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'color-mode'
  },
  
})
