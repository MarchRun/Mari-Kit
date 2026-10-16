<template>
  <div class="w-full mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="placeholder"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  modelValue: string;
  placeholder?: string;
  type?: string;
}>();
defineEmits(['update:modelValue']);
</script>