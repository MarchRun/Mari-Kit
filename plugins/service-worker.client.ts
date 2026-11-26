export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const updateReady = useState('sw-update-ready', () => false)
  let hadController = Boolean(navigator.serviceWorker.controller)

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      await registration.update()
    } catch {
      // Registration is optional; the site remains usable online without it.
    }
  }

  if (document.readyState === 'complete') {
    void register()
  } else {
    window.addEventListener('load', () => { void register() }, { once: true })
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = Boolean(navigator.serviceWorker.controller)
      return
    }

    updateReady.value = true
  })
})
