<template>
  <section id="home" class="min-h-screen flex items-center justify-center p-4 bg-neutral-900 relative overflow-hidden">
    <BackgroundPattern tone="light" />
    <div class="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10 pt-20">
      <div class="text-center md:text-left">
        <h1 class="text-7xl font-bold mb-6">MariKit</h1>
        <p class="text-neutral-400 text-lg mb-8 max-w-md mx-auto md:mx-0">
          Your professional, privacy-focused toolkit for daily tasks. Tools run in your browser, and pages you have already visited open offline.
        </p>
        <div class="flex flex-wrap gap-4 justify-center md:justify-start">
          <NuxtLink to="/#tools" class="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-neutral-200 transition">
            Access Tools
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl border border-white px-8 py-3 font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="installed"
            @click="handleInstall"
          >
            {{ installLabel }}
          </button>
        </div>
        <p v-if="installMessage" role="status" class="mt-4 max-w-md text-sm text-neutral-400 mx-auto md:mx-0">
          {{ installMessage }}
        </p>
      </div>
      <div class="hidden md:flex justify-end">
        <div class="hidden items-center justify-center md:flex">
          <SegmentedSpinner />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useInstallPrompt } from '~/composables/useInstallPrompt'

const { canInstall, installed, dismissed, promptInstall } = useInstallPrompt()
const unavailableNote = ref('')

const installLabel = computed(() => {
  if (installed.value) {
    return 'MariKit installed'
  }

  return canInstall.value ? 'Install app' : 'Install unavailable'
})

const installMessage = computed(() => {
  if (installed.value) {
    return 'MariKit is installed on this device.'
  }

  if (dismissed.value) {
    return 'Installation was dismissed. You can install it later from your browser menu.'
  }

  return unavailableNote.value
})

const handleInstall = async () => {
  if (installed.value) {
    return
  }

  if (canInstall.value) {
    unavailableNote.value = ''
    await promptInstall()
    return
  }

  unavailableNote.value = 'This browser cannot install MariKit. You can keep using it in a tab.'
}
</script>
