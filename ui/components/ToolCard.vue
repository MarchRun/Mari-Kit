<template>
  <NuxtLink 
    :to="link" 
    class="flex flex-col p-8 bg-black border border-white rounded-3xl transition hover:border-primary-600 hover:shadow-lg hover:shadow-primary-900/20"
  >
    <div class="mb-6">
      <component :is="icon" class="w-10 h-10 text-white" />
    </div>

    <h3 class="text-2xl font-bold mb-3 text-white">
      {{ title }}
    </h3>

    <p class="text-neutral-400 text-sm leading-relaxed line-clamp-2 mb-8 flex-grow">
      {{ description }}
    </p>

    <div class="mt-auto flex justify-start">
      <span class="text-sm font-bold tracking-widest text-white uppercase">
        Navigate →
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  link: string;
  icon: Component;
  title: string;
  description: string;
}>();
</script>