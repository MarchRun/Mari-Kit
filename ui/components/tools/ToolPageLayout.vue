<template>
  <div class="relative min-h-screen overflow-hidden bg-white px-4 pb-16 pt-32 text-black">
    <BackgroundPattern tone="dark" />

    <div class="relative z-10 mx-auto w-full max-w-4xl">
      <NuxtLink
        to="/#tools"
        class="mb-10 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-neutral-600 transition hover:text-black"
      >
        <ArrowLeft aria-hidden="true" class="h-5 w-5" />
        Back to tools
      </NuxtLink>

      <header class="mb-10">
        <p class="mb-3 text-sm uppercase tracking-widest text-neutral-600">
          {{ category }}
        </p>

        <h1 class="mb-4 text-4xl font-bold md:text-5xl">
          {{ title }}
        </h1>

        <p class="max-w-2xl leading-relaxed text-neutral-600">
          {{ description }}
        </p>
      </header>

      <aside class="mb-8 flex gap-3 rounded-xl border border-neutral-300 bg-white p-4 text-sm text-neutral-700">
        <ShieldCheck aria-hidden="true" class="h-5 w-5 shrink-0" />

        <slot name="privacy">
          This tool processes your data in the browser. Your input is not uploaded to a server.
        </slot>
      </aside>

      <section
        aria-label="Tool workspace"
        class="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-xl shadow-black/10 md:p-8"
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