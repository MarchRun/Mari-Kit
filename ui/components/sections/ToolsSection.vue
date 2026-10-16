<template>
  <section id="tools" class="relative min-h-screen overflow-hidden bg-white px-4 py-32">
    <BackgroundPattern tone="dark" />
    <h2 class="text-4xl font-bold mb-16 text-center text-black">Available Tools</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <ToolCard 
        title="PDF Converter"
        description="Easily convert, merge, or split your PDF documents directly in your browser."
        link="/pdf"
        :icon="FileText"
      />
      <ToolCard 
        title="QR Generator"
        description="Generate custom QR codes for your URLs or text in seconds."
        link="/qr"
        :icon="QrCode"
      />
      <ToolCard 
        title="Security Suite"
        description="Encrypt, decrypt, and generate secure hashes for your sensitive data."
        link="/security"
        :icon="ShieldCheck"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { FileText, QrCode, ShieldCheck } from 'lucide-vue-next';
</script>