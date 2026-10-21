<template>
  <ToolPageLayout
    title="PDF Organizer"
    description="Reorder, rotate, and remove pages from a PDF document."
    category="Documents"
  >
    <div class="space-y-8">
      <section aria-labelledby="organizer-source-heading">
        <div class="mb-5">
          <h2 id="organizer-source-heading" class="text-lg font-medium">
            Source PDF
          </h2>

          <p class="mt-1 text-sm text-neutral-300">
            Select one PDF document to organize.
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

      <section
        aria-labelledby="organizer-pages-heading"
        class="border-t border-neutral-700 pt-6"
      >
        <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="organizer-pages-heading" class="text-lg font-medium">
              Pages
            </h2>

            <p class="mt-1 text-sm text-neutral-300">
              Select pages before rotating or removing them.
            </p>
          </div>

          <p class="text-sm text-neutral-300">
            0 pages selected
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AppButton
            variant="secondary"
            disabled
          >
            <RotateCcw aria-hidden="true" class="h-4 w-4" />
            Rotate left
          </AppButton>

          <AppButton
            variant="secondary"
            disabled
          >
            <RotateCw aria-hidden="true" class="h-4 w-4" />
            Rotate right
          </AppButton>

          <AppButton
            variant="secondary"
            class="col-span-2 sm:col-span-1"
            disabled
          >
            <Trash2 aria-hidden="true" class="h-4 w-4" />
            Remove
          </AppButton>
        </div>

        <div class="mt-5 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-600 bg-neutral-900 p-8 text-center">
          <div>
            <LayoutGrid
              aria-hidden="true"
              class="mx-auto mb-3 h-12 w-12 text-neutral-300"
            />

            <p class="font-medium">
              {{ selectedFile ? 'Page previews are not available yet.' : 'Choose a PDF to view its pages.' }}
            </p>

            <p class="mt-2 text-sm text-neutral-300">
              Page thumbnails will appear here.
            </p>
          </div>
        </div>
      </section>

      <div class="flex flex-col gap-3 border-t border-neutral-700 pt-6 sm:flex-row">
        <AppButton
          variant="secondary"
          class="w-full sm:w-auto"
          :disabled="!selectedFile"
          @click="clearFile"
        >
          Clear
        </AppButton>

        <AppButton
          class="w-full sm:ml-auto sm:w-auto"
          disabled
        >
          <Download aria-hidden="true" class="h-4 w-4" />
          Download organized PDF
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
    </div>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Download,
  FileText,
  LayoutGrid,
  RotateCcw,
  RotateCw,
  Trash2,
  X
} from 'lucide-vue-next'

const selectedFile = ref<File>()
const statusMessage = ref('')

const handleFiles = (files: File[]) => {
  const [file] = files

  if (!file) {
    return
  }

  selectedFile.value = file
  statusMessage.value = 'Page previews are not available yet.'
}

const handleRejectedFiles = () => {
  statusMessage.value = 'Only PDF files can be added.'
}

const clearFile = () => {
  selectedFile.value = undefined
  statusMessage.value = ''
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>