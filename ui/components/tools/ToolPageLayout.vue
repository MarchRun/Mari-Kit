<template>
  <div class="min-h-screen bg-neutral-900 px-4 pb-16 pt-32 text-white">
    <div class="mx-auto w-full max-w-4xl">
      <NuxtLink
        to="/#tools"
        class="mb-10 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft aria-hidden="true" class="h-5 w-5" />
        Back to tools
      </NuxtLink>

      <header class="mb-10">
        <p class="mb-3 text-sm uppercase tracking-widest text-neutral-400">
          {{ category }}
        </p>

        <h1 class="mb-4 text-4xl font-bold md:text-5xl">
          {{ title }}
        </h1>

        <p class="max-w-2xl leading-relaxed text-neutral-400">
          {{ description }}
        </p>
      </header>

      <aside class="mb-8 flex gap-3 rounded-xl border border-white/30 p-4 text-sm text-neutral-300">
        <ShieldCheck aria-hidden="true" class="h-5 w-5 shrink-0" />
        <slot name="privacy">
          This tool processes your data in the browser. Your input is not uploaded to a server.
        </slot>
      </aside>

      <section
        aria-label="Tool workspace"
        class="rounded-3xl border border-white bg-black p-6 md:p-8"
      >
        <slot />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ShieldCheck } from 'lucide-vue-next'

defineProps<{
  title: string
  description: string
  category: string
}>()
</script>