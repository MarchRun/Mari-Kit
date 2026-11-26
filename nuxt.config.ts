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

  app: {
    head: {
      title: 'MariKit — browser tools for PDFs, QR codes, files, passwords, and hashes',
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/apple-touch-icon.png' }
      ],
      meta: [
        {
          name: 'description',
          content: 'Browser-based tools for PDFs, QR codes, file metadata removal, passwords, and hashes. Processing stays in your browser.'
        },
        { name: 'theme-color', content: '#171717' }
      ]
    }
  },

  routeRules: {
    '/sw.js': { headers: { 'cache-control': 'no-cache' } },
    '/manifest.webmanifest': { headers: { 'cache-control': 'no-cache' } }
  },

  components: [
    { path: '~/ui/components', pathPrefix: false }
  ]
})
