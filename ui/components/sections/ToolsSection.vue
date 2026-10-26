<template>
  <section
    id="tools"
    class="relative min-h-screen overflow-hidden bg-white px-4 py-32 text-black"
  >
    <BackgroundPattern tone="dark" />

    <div class="relative z-10 mx-auto max-w-6xl">
      <header class="mb-10 text-center">
        <h2 class="text-4xl font-bold">
          Available Tools
        </h2>

        <p class="mx-auto mt-4 max-w-2xl text-neutral-700">
          Find the right browser-based tool for your task.
        </p>
      </header>

      <div class="mx-auto mb-8 max-w-3xl">
        <label for="tool-search" class="sr-only">
          Search tools
        </label>

        <div class="relative">
          <Search
            aria-hidden="true"
            class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-600"
          />

          <input
            id="tool-search"
            v-model="searchQuery"
            type="search"
            placeholder="Search tools"
            autocomplete="off"
            class="min-h-14 w-full rounded-2xl border border-neutral-400 bg-white py-3 pl-12 pr-12 text-black placeholder:text-neutral-600 transition focus:border-black focus:outline-none"
          >

          <button
            v-if="searchQuery"
            type="button"
            aria-label="Clear search"
            class="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-700 transition hover:bg-neutral-200 hover:text-black"
            @click="searchQuery = ''"
          >
            <X aria-hidden="true" class="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter tools by category"
        class="mb-8 flex flex-wrap justify-center gap-3"
      >
        <button
          v-for="category in categories"
          :key="category.value"
          type="button"
          :aria-pressed="selectedCategory === category.value"
          class="min-h-11 rounded-full border px-5 py-2 text-sm font-medium transition"
          :class="selectedCategory === category.value
            ? 'border-black bg-black text-white'
            : 'border-neutral-400 bg-white text-neutral-800 hover:border-black'"
          @click="selectedCategory = category.value"
        >
          {{ category.label }}
        </button>
      </div>

      <div class="mb-5 flex items-center justify-between">
        <p
          role="status"
          aria-live="polite"
          class="text-sm text-neutral-700"
        >
          {{ resultLabel }}
        </p>
      </div>

      <div
        v-if="visibleTools.length"
        class="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
      >
        <ToolCard
          v-for="tool in visibleTools"
          :key="tool.link"
          :title="tool.title"
          :description="tool.description"
          :link="tool.link"
          :icon="tool.icon"
          :category="tool.categoryLabel"
        />
      </div>

      <div
        v-else
        class="rounded-3xl border border-neutral-300 bg-white p-10 text-center"
      >
        <SearchX
          aria-hidden="true"
          class="mx-auto mb-4 h-10 w-10 text-neutral-600"
        />

        <h3 class="text-xl font-bold">
          No tools found
        </h3>

        <p class="mt-2 text-neutral-700">
          Try another search term or category.
        </p>
      </div>

      <div v-if="hasMoreTools" class="mt-10 text-center">
        <button
          type="button"
          class="min-h-11 rounded-xl border border-black bg-black px-6 py-3 font-medium text-white transition hover:bg-neutral-800"
          @click="loadMore"
        >
          Load {{ nextBatchSize }} more
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  Files,
  Hash,
  KeyRound,
  LayoutGrid,
  QrCode,
  ScanLine,
  Scissors,
  Search,
  SearchX,
  X
} from 'lucide-vue-next'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

type ToolCategory = 'documents' | 'qr' | 'security'
type CategoryFilter = 'all' | ToolCategory

interface Tool {
  title: string
  description: string
  link: string
  icon: Component
  category: ToolCategory
  categoryLabel: string
}

const tools: Tool[] = [
  {
    title: 'PDF Merger',
    description: 'Combine multiple PDF documents into a single file directly in your browser.',
    link: '/pdf/merge',
    icon: Files,
    category: 'documents',
    categoryLabel: 'Documents'
  },
  {
    title: 'PDF Splitter',
    description: 'Extract selected pages or split a PDF into separate documents directly in your browser.',
    link: '/pdf/split',
    icon: Scissors,
    category: 'documents',
    categoryLabel: 'Documents'
  },
  {
    title: 'PDF Organizer',
    description: 'Reorder, rotate, and remove PDF pages directly in your browser.',
    link: '/pdf/organize',
    icon: LayoutGrid,
    category: 'documents',
    categoryLabel: 'Documents'
  },
  {
    title: 'QR Generator',
    description: 'Generate QR codes for URLs or text directly in your browser.',
    link: '/qr/generator',
    icon: QrCode,
    category: 'qr',
    categoryLabel: 'QR Codes'
  },
  {
    title: 'QR Scanner',
    description: 'Scan QR codes from images or your device camera.',
    link: '/qr/scanner',
    icon: ScanLine,
    category: 'qr',
    categoryLabel: 'QR Codes'
  },
  {
    title: 'Password Generator',
    description: 'Create customizable random passwords directly in your browser.',
    link: '/security/password',
    icon: KeyRound,
    category: 'security',
    categoryLabel: 'Security'
  },
  {
    title: 'Hash Generator',
    description: 'Generate SHA hashes from text without sending it to a server.',
    link: '/security/hash',
    icon: Hash,
    category: 'security',
    categoryLabel: 'Security'
  }
]

const categories: Array<{
  value: CategoryFilter
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'documents', label: 'Documents' },
  { value: 'qr', label: 'QR Codes' },
  { value: 'security', label: 'Security' }
]

const searchQuery = ref('')
const selectedCategory = ref<CategoryFilter>('all')
const pageSize = ref(6)
const visibleCount = ref(6)

const normalizedSearch = computed(() =>
  searchQuery.value.trim().toLowerCase()
)

const filteredTools = computed(() =>
  tools.filter(tool => {
    const matchesCategory =
      selectedCategory.value === 'all'
      || tool.category === selectedCategory.value

    const searchableText = [
      tool.title,
      tool.description,
      tool.categoryLabel
    ].join(' ').toLowerCase()

    return matchesCategory
      && searchableText.includes(normalizedSearch.value)
  })
)

const visibleTools = computed(() =>
  filteredTools.value.slice(0, visibleCount.value)
)

const hasMoreTools = computed(() =>
  visibleCount.value < filteredTools.value.length
)

const nextBatchSize = computed(() =>
  Math.min(
    pageSize.value,
    filteredTools.value.length - visibleCount.value
  )
)

const loadMore = () => {
  visibleCount.value += pageSize.value
}

const resultLabel = computed(() => {
  const total = filteredTools.value.length

  if (total === 0) {
    return '0 tools found'
  }

  return `Showing ${visibleTools.value.length} of ${total} tools`
})

const updatePageSize = () => {
  const nextPageSize = window.innerWidth >= 1024 ? 6 : 4

  if (visibleCount.value === pageSize.value) {
    visibleCount.value = nextPageSize
  }

  pageSize.value = nextPageSize
}

watch([searchQuery, selectedCategory], () => {
  visibleCount.value = pageSize.value
})

onMounted(() => {
  updatePageSize()
  window.addEventListener('resize', updatePageSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSize)
})
</script>