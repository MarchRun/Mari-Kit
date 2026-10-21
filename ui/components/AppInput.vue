<template>
  <div class="w-full">
    <label
      :for="inputId"
      class="mb-2 block text-sm font-medium text-neutral-200"
    >
      {{ label }}
    </label>

    <input
      v-bind="$attrs"
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-describedby="descriptionId"
      :aria-invalid="error ? 'true' : undefined"
      class="min-h-12 w-full rounded-xl border border-neutral-600 bg-neutral-950 px-4 py-3 text-white caret-white placeholder:text-neutral-400 transition-colors hover:border-neutral-400 focus:border-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      @input="handleInput"
    >

    <p
      v-if="error"
      :id="descriptionId"
      class="mt-2 text-sm text-neutral-300"
    >
      {{ error }}
    </p>

    <p
      v-else-if="hint"
      :id="descriptionId"
      class="mt-2 text-sm text-neutral-400"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

defineOptions({
  inheritAttrs: false
})

const props = withDefaults(
  defineProps<{
    id?: string
    label: string
    modelValue: string
    placeholder?: string
    type?: string
    hint?: string
    error?: string
  }>(),
  {
    type: 'text'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const descriptionId = computed(() =>
  props.error || props.hint ? `${inputId.value}-description` : undefined
)

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>