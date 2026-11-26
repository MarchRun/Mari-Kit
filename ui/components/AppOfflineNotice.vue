<template>
  <div
    v-if="visible"
    role="status"
    class="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-sm text-white shadow-lg"
  >
    <span>You are offline. Only pages you have already visited are available.</span>
    <button
      type="button"
      class="rounded-lg bg-white px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-200"
      @click="retry"
    >
      Retry
    </button>
  </div>
</template>

<script setup lang="ts">
const visible = useState('offline-notice-visible', () => false)
const retryPath = useState('offline-notice-path', () => '/')

const retry = () => {
  window.location.assign(retryPath.value || '/')
}
</script>
