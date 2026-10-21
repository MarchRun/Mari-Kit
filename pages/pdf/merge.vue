<template>
  <ToolPageLayout
    title="PDF Merger"
    description="Combine multiple PDF documents into a single file."
    category="Documents"
  >
    <form class="space-y-8" @submit.prevent="handleMerge">
      <section aria-labelledby="pdf-files-heading">
        <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="pdf-files-heading" class="text-lg font-medium">
              PDF files
            </h2>

            <p class="mt-1 text-sm text-neutral-300">
              Files will be merged in the order shown below.
            </p>
          </div>

          <p
            aria-live="polite"
            class="text-sm text-neutral-300"
          >
            {{ files.length }} {{ files.length === 1 ? 'file' : 'files' }} selected
          </p>
        </div>

        <AppFileDropZone
          label="Choose PDF files"
          hint="Select or drop at least two documents"
          accept="application/pdf,.pdf"
          multiple
          @files-selected="addFiles"
          @files-rejected="handleRejectedFiles"
        />
      </section>

      <ol v-if="files.length" class="space-y-3">
        <li
          v-for="(file, index) in files"
          :key="`${file.name}-${file.size}-${file.lastModified}`"
          class="flex items-center gap-4 rounded-xl border border-neutral-700 bg-neutral-900 p-4"
        >
          <FileText
            aria-hidden="true"
            class="h-6 w-6 shrink-0 text-neutral-300"
          />

          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">
              {{ file.name }}
            </p>

            <p class="mt-1 text-sm text-neutral-300">
              {{ formatFileSize(file.size) }}
            </p>
          </div>

          <div class="flex shrink-0 items-center">
            <button
              type="button"
              class="rounded-lg p-2 text-neutral-300 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:text-neutral-600"
              :disabled="index === 0"
              :aria-label="`Move ${file.name} up`"
              @click="moveFile(index, -1)"
            >
              <ArrowUp aria-hidden="true" class="h-5 w-5" />
            </button>

            <button
              type="button"
              class="rounded-lg p-2 text-neutral-300 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:text-neutral-600"
              :disabled="index === files.length - 1"
              :aria-label="`Move ${file.name} down`"
              @click="moveFile(index, 1)"
            >
              <ArrowDown aria-hidden="true" class="h-5 w-5" />
            </button>

            <button
              type="button"
              class="rounded-lg p-2 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              :aria-label="`Remove ${file.name}`"
              @click="removeFile(index)"
            >
              <Trash2 aria-hidden="true" class="h-5 w-5" />
            </button>
          </div>
        </li>
      </ol>

      <div class="flex flex-col gap-3 border-t border-neutral-700 pt-6 sm:flex-row">
        <AppButton
          type="submit"
          class="w-full sm:w-auto"
          :disabled="files.length < 2"
        >
          <Files aria-hidden="true" class="h-4 w-4" />
          Merge PDF
        </AppButton>

        <AppButton
          variant="secondary"
          class="w-full sm:w-auto"
          :disabled="files.length === 0"
          @click="clearFiles"
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
import { ref } from 'vue'
import {
  ArrowDown,
  ArrowUp,
  Download,
  Files,
  FileText,
  Trash2
} from 'lucide-vue-next'

const files = ref<File[]>([])
const statusMessage = ref('')

const addFiles = (selectedFiles: File[]) => {
  files.value = [...files.value, ...selectedFiles]
  statusMessage.value = ''
}

const handleRejectedFiles = () => {
  statusMessage.value = 'Only PDF files can be added.'
}

const moveFile = (index: number, direction: number) => {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= files.value.length) {
    return
  }

  const reorderedFiles = [...files.value]
  const [file] = reorderedFiles.splice(index, 1)

  if (!file) {
    return
  }

  reorderedFiles.splice(targetIndex, 0, file)
  files.value = reorderedFiles
}

const removeFile = (index: number) => {
  files.value = files.value.filter((_, fileIndex) => fileIndex !== index)
  statusMessage.value = ''
}

const clearFiles = () => {
  files.value = []
  statusMessage.value = ''
}

const handleMerge = () => {
  statusMessage.value = 'PDF merging is not available yet.'
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>