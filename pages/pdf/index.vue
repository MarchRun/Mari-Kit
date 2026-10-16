<template>
  <div class="max-w-2xl mx-auto py-12 px-4 text-center">
    <h1 class="text-4xl font-bold mb-4">Welcome to MariKit</h1>
    <p class="text-neutral-600 text-lg">
      A collection of client-side utilities for your daily tasks. Private, fast, and offline-first.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const loading = ref(false);

const handleCreatePdf = async () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    alert('Logika PDF sedang dinonaktifkan sementara.');
  }, 1000);
}
</script>