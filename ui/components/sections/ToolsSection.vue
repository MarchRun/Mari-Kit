<template>
  <section id="tools" class="relative min-h-screen overflow-hidden bg-white px-4 py-32">
    <BackgroundPattern tone="dark" />
    <h2 class="text-4xl font-bold mb-16 text-center text-black">Available Tools</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <ToolCard
        title="PDF Merger"
        description="Combine multiple PDF documents into a single file directly in your browser."
        link="/pdf/merge"
        :icon="Files"
      />
      <ToolCard
        title="PDF Splitter"
        description="Extract selected pages or split a PDF into separate documents directly in your browser."
        link="/pdf/split"
        :icon="Scissors"
      />
      <ToolCard
        title="PDF Organizer"
        description="Reorder, rotate, and remove PDF pages directly in your browser."
        link="/pdf/organize"
        :icon="LayoutGrid"
      />
      <ToolCard
        title="QR Generator"
        description="Generate QR codes for URLs or text directly in your browser."
        link="/qr/generator"
        :icon="QrCode"
      />
      <ToolCard
        title="QR Scanner"
        description="Scan QR codes from images or your device camera."
        link="/qr/scanner"
        :icon="ScanLine"
      />
      <ToolCard
        title="Password Generator"
        description="Create customizable random passwords directly in your browser."
        link="/security/password"
        :icon="KeyRound"
      />
      <ToolCard
        title="Hash Generator"
        description="Generate SHA hashes from text without sending it to a server."
        link="/security/hash"
        :icon="Hash"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  Files,
  Hash,
  KeyRound,
  LayoutGrid,
  QrCode,
  ScanLine,
  Scissors
} from 'lucide-vue-next'
</script>