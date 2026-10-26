<template>
  <NuxtLink
    :to="link"
    class="group flex items-center rounded-3xl border border-white bg-black p-5 text-white transition hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none md:min-h-80 md:flex-col md:items-stretch md:p-8"
  >
    <div class="mr-4 shrink-0 md:mb-6 md:mr-0">
      <component
        :is="icon"
        aria-hidden="true"
        class="h-9 w-9 md:h-10 md:w-10"
      />
    </div>

    <div class="min-w-0 flex-1 md:flex md:flex-col">
      <p class="mb-1 text-xs uppercase tracking-widest text-neutral-300">
        {{ category }}
      </p>

      <h3 class="text-xl font-bold md:mb-3 md:text-2xl">
        {{ title }}
      </h3>

      <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-300 md:mb-8 md:mt-0 md:flex-grow">
        {{ description }}
      </p>

      <span class="mt-auto hidden items-center gap-2 pt-5 text-sm font-bold uppercase tracking-widest md:flex">
        Open tool
        <ArrowRight
          aria-hidden="true"
          class="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
        />
      </span>
    </div>

    <ArrowRight
      aria-hidden="true"
      class="ml-3 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transform-none md:hidden"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowRight } from 'lucide-vue-next'

defineProps<{
  link: string
  icon: Component
  title: string
  description: string
  category: string
}>()
</script>