<template>
  <header class="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 w-full">
    <nav class="bg-black text-white rounded-full px-8 py-4 shadow-lg flex items-center justify-between w-full max-w-6xl border border-white">
      <NuxtLink to="/" class="font-bold text-xl tracking-tight">
        MariKit
      </NuxtLink>

      <div class="hidden md:flex gap-8 items-center text-sm font-medium">
        <NuxtLink to="/#home" class="hover:text-primary-400 transition">Home</NuxtLink>
        <NuxtLink to="/#tools" class="hover:text-primary-400 transition">Tools</NuxtLink>
        <NuxtLink to="/#contact" class="hover:text-primary-400 transition">Contact</NuxtLink>
      </div>

      <button @click="isOpen = !isOpen" class="md:hidden ml-auto p-2">
        <svg v-if="!isOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </nav>

    <div v-if="isOpen" class="md:hidden absolute top-20 left-4 right-4 bg-black rounded-2xl p-6 text-white border border-white shadow-xl">
      <div class="flex flex-col gap-4 text-center font-medium">
        <NuxtLink to="/#home" @click="isOpen = false">Home</NuxtLink>
        <NuxtLink to="/#tools" @click="isOpen = false">Tools</NuxtLink>
        <NuxtLink to="/#contact" @click="isOpen = false">Contact</NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const isOpen = ref(false);
</script>
