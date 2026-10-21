<template>
  <ToolPageLayout
    title="PDF Splitter"
    description="Extract selected pages or split a PDF into separate documents."
    category="Documents"
  >
    <form class="space-y-8" @submit.prevent="handleSplit">
      <section aria-labelledby="source-pdf-heading">
        <div class="mb-5">
          <h2 id="source-pdf-heading" class="text-lg font-medium">
            Source PDF
          </h2>

          <p class="mt-1 text-sm text-neutral-300">
            Select one PDF document to split.
          </p>
        </div>

        <AppFileDropZone
          label="Choose a PDF file"
          hint="Select or drop one document"
          accept="application/pdf,.pdf"
          @files-selected="handleFiles"
          @files-rejected="handleRejectedFiles"
        />

        <div
          v-if="selectedFile"
          class="mt-4 flex items-center gap-4 rounded-xl border border-neutral-700 bg-neutral-900 p-4"
        >
          <FileText
            aria-hidden="true"
            class="h-6 w-6 shrink-0 text-neutral-300"
          />

          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">
              {{ selectedFile.name }}
            </p>

            <p class="mt-1 text-sm text-neutral-300">
              {{ formatFileSize(selectedFile.size) }}
            </p>
          </div>

          <button
            type="button"
            class="rounded-lg p-2 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
            aria-label="Remove selected PDF"
            @click="clearFile"
          >
            <X aria-hidden="true" class="h-5 w-5" />
          </button>
        </div>
      </section>

      <fieldset class="border-t border-neutral-700 pt-6">
        <legend class="text-lg font-medium">
          Split method
        </legend>

        <div class="mt-4 space-y-3">
          <label
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-700 bg-neutral-900 p-4 hover:border-neutral-500"
          >
            <input
              v-model="splitMethod"
              type="radio"
              value="range"
              class="mt-1 h-4 w-4 accent-white"
            >

            <span>
              <span class="block font-medium">Extract page ranges</span>
              <span class="mt-1 block text-sm text-neutral-300">
                Create a new PDF containing specific pages.
              </span>
            </span>
          </label>

          <label
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-700 bg-neutral-900 p-4 hover:border-neutral-500"
          >
            <input
              v-model="splitMethod"
              type="radio"
              value="everyPage"
              class="mt-1 h-4 w-4 accent-white"
            >

            <span>
              <span class="block font-medium">Split every page</span>
              <span class="mt-1 block text-sm text-neutral-300">
                Create a separate PDF for each page.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <AppInput
        v-if="splitMethod === 'range'"
        v-model="pageRange"
        label="Page range"
        name="pageRange"
        placeholder="1-3, 5, 8-10"
        hint="Separate pages or ranges with commas."
        autocomplete="off"
        required
      />

      <div class="flex flex-col gap-3 border-t border-neutral-700 pt-6 sm:flex-row">
        <AppButton
          type="submit"
          class="w-full sm:w-auto"
          :disabled="!canSplit"
        >
          <Scissors aria-hidden="true" class="h-4 w-4" />
          Split PDF
        </AppButton>

        <AppButton
          variant="secondary"
          class="w-full sm:w-auto"
          :disabled="!selectedFile && !pageRange"
          @click="clearForm"
        >
          Clear
        </AppButton>

        <AppButton
          class="w-full sm:ml-auto sm:w-auto"
          disabled
        >
          <Download aria-hidden="true" class="h-4 w-4" />
          Download
        </AppButton>
      </div>

      <p
        v-if="statusMessage"
        role="status"
        aria-live="polite"
        class="text-sm text-neutral-200"
      >
        {{ statusMessage }}
      </p>
    </form>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Download,
  FileText,
  Scissors,
  X
} from 'lucide-vue-next'

type SplitMethod = 'range' | 'everyPage'

const selectedFile = ref<File>()
const splitMethod = ref<SplitMethod>('range')
const pageRange = ref('')
const statusMessage = ref('')

const canSplit = computed(() => {
  if (!selectedFile.value) {
    return false
  }

  if (splitMethod.value === 'range') {
    return pageRange.value.trim().length > 0
  }

  return true
})

const handleFiles = (files: File[]) => {
  const [file] = files

  if (!file) {
    return
  }

  selectedFile.value = file
  statusMessage.value = ''
}

const handleRejectedFiles = () => {
  statusMessage.value = 'Only PDF files can be added.'
}

const clearFile = () => {
  selectedFile.value = undefined
  statusMessage.value = ''
}

const clearForm = () => {
  selectedFile.value = undefined
  splitMethod.value = 'range'
  pageRange.value = ''
  statusMessage.value = ''
}

const handleSplit = () => {
  statusMessage.value = 'PDF splitting is not available yet.'
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>