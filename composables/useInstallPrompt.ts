import { computed, ref } from 'vue'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<InstallPromptEvent | null>(null)
const installed = ref(false)
const dismissed = ref(false)
let listening = false

const listen = () => {
  if (listening || typeof window === 'undefined') {
    return
  }

  listening = true

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    deferredPrompt.value = event as InstallPromptEvent
    dismissed.value = false
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    installed.value = true
    dismissed.value = false
  })
}

export const useInstallPrompt = () => {
  listen()

  const canInstall = computed(() => deferredPrompt.value !== null && !installed.value)

  const promptInstall = async () => {
    const event = deferredPrompt.value

    if (!event) {
      return false
    }

    deferredPrompt.value = null
    await event.prompt()
    const choice = await event.userChoice
    dismissed.value = choice.outcome === 'dismissed'

    return choice.outcome === 'accepted'
  }

  return { canInstall, installed, dismissed, promptInstall }
}
