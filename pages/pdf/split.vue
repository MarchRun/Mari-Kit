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
          :loading="isSplitting"
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
          :disabled="results.length === 0"
          @click="downloadResults"
        >
          <Download aria-hidden="true" class="h-4 w-4" />
          {{ results.length > 1 ? `Download ${results.length} files` : 'Download' }}
        </AppButton>
      </div>

      <p
        v-if="statusMessage"
        :role="statusType === 'error' ? 'alert' : 'status'"
        :aria-live="statusType === 'error' ? 'assertive' : 'polite'"
        class="text-sm"
        :class="statusType === 'error' ? 'text-red-300' : 'text-neutral-200'"
      >
        {{ statusMessage }}
      </p>
    </form>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { PDFDocument } from 'pdf-lib'
import { getPdfFileName } from '~/utils/downloadFileName'
import { isEncryptedPdfError } from '~/utils/pdf/isEncryptedPdfError'
import {
  Download,
  FileText,
  Scissors,
  X
} from 'lucide-vue-next'

type SplitMethod = 'range' | 'everyPage'
type StatusType = 'success' | 'error' | ''
type SplitResult = {
  name: string
  url: string
}

const selectedFile = ref<File>()
const splitMethod = ref<SplitMethod>('range')
const pageRange = ref('')
const statusMessage = ref('')
const statusType = ref<StatusType>('')
const isSplitting = ref(false)
const results = ref<SplitResult[]>([])
let splitVersion = 0

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
  resetResult()
}

const handleRejectedFiles = () => {
  resetResult()
  statusMessage.value = 'Only PDF files can be added.'
  statusType.value = 'error'
}

const clearFile = () => {
  selectedFile.value = undefined
  resetResult()
}

const clearForm = () => {
  selectedFile.value = undefined
  splitMethod.value = 'range'
  pageRange.value = ''
  resetResult()
}

const clearResults = () => {
  for (const result of results.value) {
    URL.revokeObjectURL(result.url)
  }

  results.value = []
}

const resetResult = () => {
  splitVersion += 1
  clearResults()
  statusMessage.value = ''
  statusType.value = ''
}

const parsePageRange = (value: string, pageCount: number) => {
  const pages: number[] = []

  for (const part of value.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/)

    if (!match) {
      throw new RangeError('Enter pages as numbers or ranges, such as 1-3, 5, 8-10.')
    }

    const start = Number(match[1])
    const end = Number(match[2] ?? match[1])

    if (start < 1 || end < start || end > pageCount) {
      throw new RangeError(`Use pages from 1 to ${pageCount} in ascending ranges.`)
    }

    for (let page = start; page <= end; page += 1) {
      if (!pages.includes(page - 1)) {
        pages.push(page - 1)
      }
    }
  }

  return pages
}

const createResult = async (
  sourcePdf: PDFDocument,
  pageIndices: number[],
  name: string,
  version: number
) => {
  const outputPdf = await PDFDocument.create()
  const pages = await outputPdf.copyPages(sourcePdf, pageIndices)

  for (const page of pages) {
    outputPdf.addPage(page)
  }

  const bytes = await outputPdf.save({ useObjectStreams: true })
  if (version !== splitVersion) return
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })

  results.value.push({
    name,
    url: URL.createObjectURL(blob)
  })
}

const handleSplit = async () => {
  if (!selectedFile.value || !canSplit.value || isSplitting.value) {
    return
  }

  clearResults()
  const version = ++splitVersion
  const file = selectedFile.value
  const method = splitMethod.value
  const range = pageRange.value
  isSplitting.value = true
  statusMessage.value = 'Splitting PDF...'
  statusType.value = ''

  try {
    const bytes = await file.arrayBuffer()
    if (version !== splitVersion) return
    const sourcePdf = await PDFDocument.load(bytes)
    if (version !== splitVersion) return
    const pageCount = sourcePdf.getPageCount()

    if (method === 'range') {
      const pageIndices = parsePageRange(range, pageCount)
      await createResult(sourcePdf, pageIndices, getPdfFileName(file.name, 'split'), version)
    } else {
      for (let index = 0; index < pageCount; index += 1) {
        if (version !== splitVersion) return
        await createResult(sourcePdf, [index], getPdfFileName(file.name, `page-${index + 1}`), version)
      }
    }

    if (version !== splitVersion) return
    statusMessage.value = results.value.length === 1
      ? 'PDF split successfully.'
      : `PDF split successfully into ${results.value.length} files.`
    statusType.value = 'success'
  } catch (error) {
    if (version !== splitVersion) return
    clearResults()
    statusMessage.value = error instanceof RangeError
      ? error.message
      : isEncryptedPdfError(error)
        ? 'This PDF is encrypted. Please choose an unencrypted copy.'
        : 'Unable to split this PDF. The file may be damaged or unsupported.'
    statusType.value = 'error'
  } finally {
    isSplitting.value = false
  }
}

const downloadResults = () => {
  for (const result of results.value) {
    const link = document.createElement('a')
    link.href = result.url
    link.download = result.name
    link.click()
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

watch([splitMethod, pageRange], resetResult, { flush: 'sync' })

onBeforeUnmount(() => {
  splitVersion += 1
  clearResults()
})
</script>
