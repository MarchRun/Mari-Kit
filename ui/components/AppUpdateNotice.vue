<template>
  <div
    v-if="updateReady"
    role="status"
    class="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-sm text-white shadow-lg"
  >
    <span>A new version of MariKit is ready.</span>
    <button
      type="button"
      class="rounded-lg bg-white px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-200"
      @click="reload"
    >
      Reload
    </button>
  </div>
</template>

<script setup lang="ts">
const updateReady = useState('sw-update-ready', () => false)

const reload = () => {
  window.location.reload()
}
</script>
