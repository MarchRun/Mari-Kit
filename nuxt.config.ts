export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  postcss: {
    plugins: {
      'tailwindcss/nesting': false
    }
  },

  components: [
    { path: '~/ui/components', pathPrefix: false }
  ]
})
