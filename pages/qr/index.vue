<template>
  <div class="max-w-xl mx-auto py-12 px-4">
    <AppCard>
      <AppTitle>QR Code Generator</AppTitle>
      
      <AppInput 
        label="Masukkan Teks atau URL" 
        v-model="qrText" 
        placeholder="https://example.com" 
      />
      
      <div class="mt-6 flex justify-center">
        <div class="w-48 h-48 border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 rounded-lg">
          <span class="text-gray-400 text-sm">Preview QR</span>
        </div>
      </div>

      <div class="mt-8">
        <AppButton @click="handleGenerate" :disabled="!qrText">
          Generate QR Code
        </AppButton>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const qrText = ref('');

const handleGenerate = () => {
  alert('Fitur QR Generator sedang dalam pengembangan UI!');
};
</script>