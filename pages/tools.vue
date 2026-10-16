<template>
  <div class="py-12 px-4">
    <h1 class="text-3xl font-bold mb-8 text-center">Available Tools</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ToolCard 
        v-for="tool in tools" 
        :key="tool.title"
        :title="tool.title"
        :description="tool.description"
        :link="tool.link"
        :icon="tool.icon"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText, QrCode, ShieldCheck } from 'lucide-vue-next';

const tools = [
  {
    title: 'PDF Converter',
    description: 'Easily convert, merge, or split your PDF documents directly in your browser.',
    link: '/pdf',
    icon: FileText
  },
  {
    title: 'QR Generator',
    description: 'Generate custom QR codes for your URLs or text in seconds.',
    link: '/qr',
    icon: QrCode
  },
  {
    title: 'Security Suite',
    description: 'Encrypt, decrypt, and generate secure hashes for your sensitive data.',
    link: '/security',
    icon: ShieldCheck
  }
];
</script>