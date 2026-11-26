<template>
  <ToolPageLayout
    title="File Metadata Remover"
    description="Remove embedded metadata from JPEG, PNG, WebP, SVG, and PDF files without uploading them."
    category="Files"
  >
    <div class="space-y-6">
      <AppFileDropZone
        v-if="!selectedFile"
        label="Choose a file to clean"
        hint="JPEG, PNG, WebP, SVG, or PDF"
        accept=".jpg,.jpeg,.png,.webp,.svg,.pdf,image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
        @files-selected="handleFiles"
        @files-rejected="handleRejectedFiles"
      />

      <div
        v-else
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-700 bg-neutral-900 p-4"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">
            {{ selectedFile.name }}
          </p>
          <p class="text-sm text-neutral-300">
            {{ formatFileSize(selectedFile.size) }} before cleaning
          </p>
        </div>

        <AppButton variant="secondary" @click="reset">
          Choose another file
        </AppButton>
      </div>

      <p v-if="errorMessage" role="alert" class="text-sm text-red-300">
        {{ errorMessage }}
      </p>

      <div v-if="isWorking" role="status" class="text-sm text-neutral-300">
        Reading and cleaning the file in this browser...
      </div>

      <div
        v-if="result?.ok && result.removed.length === 0"
        role="status"
        class="rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-200"
      >
        No removable metadata was found in this {{ formatLabels[result.format] }} file. Nothing was changed, so there is nothing to download.
      </div>

      <div
        v-if="result?.ok && result.removed.length > 0"
        role="status"
        class="space-y-4 rounded-xl border border-neutral-700 bg-neutral-900 p-4"
      >
        <div>
          <h2 class="text-lg font-semibold">
            Cleaned file ready
          </h2>
          <p class="mt-1 text-sm text-neutral-300">
            {{ formatLabels[result.format] }}, {{ formatFileSize(selectedFile?.size ?? 0) }} before and {{ formatFileSize(result.output.length) }} after. Page and image content is not re-encoded.
          </p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-neutral-200">
            Removed
          </h3>
          <ul class="mt-1 list-inside list-disc text-sm text-neutral-300">
            <li v-for="item in result.removed" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>

        <div v-if="result.kept.length">
          <h3 class="text-sm font-medium text-neutral-200">
            Kept
          </h3>
          <ul class="mt-1 list-inside list-disc text-sm text-neutral-300">
            <li v-for="item in result.kept" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>

        <ul v-if="result.notes.length" class="list-inside list-disc text-sm text-neutral-300">
          <li v-for="note in result.notes" :key="note">
            {{ note }}
          </li>
        </ul>

        <AppButton @click="downloadResult">
          <Download aria-hidden="true" class="h-4 w-4" />
          Download cleaned file
        </AppButton>
      </div>
    </div>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Download } from 'lucide-vue-next'
import { cleanFile, formatLabels, type CleanResult } from '~/logic/metadata'
import { getCleanedFileName } from '~/utils/downloadFileName'
import type { MetadataFormat } from '~/logic/metadata/types'

const mimeTypes: Record<MetadataFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf'
}

const selectedFile = ref<File | null>(null)
const result = ref<CleanResult | null>(null)
const errorMessage = ref('')
const isWorking = ref(false)
const resultUrl = ref('')
const resultName = ref('')
let runId = 0

const clearResult = () => {
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value)
  }

  resultUrl.value = ''
  resultName.value = ''
  result.value = null
  errorMessage.value = ''
}

const reset = () => {
  runId += 1
  clearResult()
  selectedFile.value = null
  isWorking.value = false
}

const handleRejectedFiles = () => {
  clearResult()
  errorMessage.value = 'Only JPEG, PNG, WebP, SVG, and PDF files can be cleaned.'
}

const handleFiles = async (files: File[]) => {
  const file = files[0]

  if (!file) {
    return
  }

  clearResult()
  selectedFile.value = file
  isWorking.value = true
  const currentRun = ++runId

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const cleaned = await cleanFile(bytes)

    if (currentRun !== runId) {
      return
    }

    result.value = cleaned

    if (!cleaned.ok) {
      errorMessage.value = cleaned.message
      return
    }

    if (cleaned.removed.length > 0) {
      const blob = new Blob([new Uint8Array(cleaned.output)], { type: mimeTypes[cleaned.format] })
      resultUrl.value = URL.createObjectURL(blob)
      resultName.value = getCleanedFileName(file.name, cleaned.format)
    }
  } catch {
    if (currentRun === runId) {
      errorMessage.value = 'This file could not be read. It may be damaged.'
    }
  } finally {
    if (currentRun === runId) {
      isWorking.value = false
    }
  }
}

const downloadResult = () => {
  if (!resultUrl.value) {
    return
  }

  const link = document.createElement('a')
  link.href = resultUrl.value
  link.download = resultName.value
  link.click()
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} bytes`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onBeforeUnmount(() => {
  runId += 1
  clearResult()
})
</script>
