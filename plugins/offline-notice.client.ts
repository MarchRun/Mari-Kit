export default defineNuxtPlugin(nuxtApp => {
  const visible = useState('offline-notice-visible', () => false)
  const retryPath = useState('offline-notice-path', () => '/')
  let pendingPath = '/'

  nuxtApp.$router.beforeEach(to => {
    pendingPath = to.fullPath
  })

  nuxtApp.hook('app:error', () => {
    if (!navigator.onLine) {
      retryPath.value = pendingPath
      visible.value = true
    }
  })

  window.addEventListener('online', () => {
    visible.value = false
  })
})
