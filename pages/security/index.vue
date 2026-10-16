<template>
  <div class="max-w-xl mx-auto py-12 px-4">
    <AppCard>
      <AppTitle>Password Generator</AppTitle>
      
      <AppInput 
        label="Panjang Password" 
        v-model="passLength" 
        type="number" 
        placeholder="16" 
      />

      <div class="bg-gray-100 p-4 rounded-lg text-center font-mono text-xl my-6">
        {{ generatedPassword || '••••••••' }}
      </div>

      <AppButton @click="handleGeneratePassword">
        Generate Password
      </AppButton>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const passLength = ref('16');
const generatedPassword = ref('');

const handleGeneratePassword = () => {
  generatedPassword.value = "ContohPassword123!";
  alert('Fitur Password Generator sedang dalam pengembangan UI!');
};
</script>