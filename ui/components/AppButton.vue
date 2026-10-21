<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-neutral-700 disabled:bg-neutral-800 disabled:text-neutral-300 disabled:opacity-100 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-800"
    :class="variantClasses"
  >
    <LoaderCircle
      v-if="loading"
      aria-hidden="true"
      class="h-4 w-4 animate-spin motion-reduce:animate-none"
    />

    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary'
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    disabled: false,
    loading: false
  }
)

const variantClasses = computed(() => {
  if (props.variant === 'secondary') {
    return 'border-neutral-600 bg-transparent text-white hover:border-white hover:bg-neutral-900'
  }

  return 'border-white bg-white text-black hover:border-neutral-300 hover:bg-neutral-300'
})
</script>