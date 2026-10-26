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
              Drag the handles to reorder files. Files will be merged in this order.
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
          :current-total-bytes="files.reduce((total, entry) => total + entry.file.size, 0)"
          @files-selected="addFiles"
          @files-rejected="handleRejectedFiles"
        />
      </section>

      <ol
        v-if="files.length"
        class="space-y-3"
        @pointermove="dragFile"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @lostpointercapture="endDrag"
      >
        <li
          v-for="({ file, id }, index) in files"
          :key="id"
          :data-file-index="index"
          class="flex items-center gap-4 rounded-xl border border-neutral-700 bg-neutral-900 p-4"
          :class="dragIndex === index ? 'border-white ring-1 ring-white' : ''"
        >
          <button
            type="button"
            class="touch-none select-none rounded-lg p-3 text-neutral-300 hover:bg-neutral-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed"
            :class="dragIndex === index ? 'cursor-grabbing' : 'cursor-grab'"
            :disabled="isMerging"
            :aria-label="`Reorder ${file.name}, position ${index + 1} of ${files.length}`"
            aria-describedby="reorder-help"
            @pointerdown="startDrag($event, index)"
            @keydown.up.prevent="moveFile(index, -1)"
            @keydown.down.prevent="moveFile(index, 1)"
          >
            <GripVertical aria-hidden="true" class="h-5 w-5" />
          </button>
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
              class="rounded-lg p-2 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              :aria-label="`Remove ${file.name}`"
              @click="removeFile(index)"
            >
              <Trash2 aria-hidden="true" class="h-5 w-5" />
            </button>
          </div>
        </li>
      </ol>
      <p id="reorder-help" class="sr-only">
        Drag to reorder, or use the Up and Down arrow keys when a handle is focused.
      </p>
      <p class="sr-only" role="status">{{ reorderMessage }}</p>

      <div class="flex flex-col gap-3 border-t border-neutral-700 pt-6 sm:flex-row">
        <AppButton
          type="submit"
          class="w-full sm:w-auto"
          :disabled="files.length < 2"
          :loading="isMerging"
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
          :disabled="!resultUrl"
          @click="downloadResult"
        >
          <Download aria-hidden="true" class="h-4 w-4" />
          Download
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
import { onBeforeUnmount, ref } from 'vue'
import { PDFDocument } from 'pdf-lib'
import { getPdfFileName } from '~/utils/downloadFileName'
import { isEncryptedPdfError } from '~/utils/pdf/isEncryptedPdfError'
import {
  GripVertical,
  Download,
  Files,
  FileText,
  Trash2
} from 'lucide-vue-next'

type StatusType = 'success' | 'error' | ''

const files = ref<{ id: number; file: File }[]>([])
let nextFileId = 0
const dragIndex = ref<number>()
const reorderMessage = ref('')
const resultUrl = ref('')
const resultName = ref('')
const isMerging = ref(false)
const statusMessage = ref('')
const statusType = ref<StatusType>('')
let mergeVersion = 0

const clearMergeResult = () => {
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value)
  }

  resultUrl.value = ''
  resultName.value = ''
}

const resetStatus = () => {
  mergeVersion += 1
  clearMergeResult()
  statusMessage.value = ''
  statusType.value = ''
}

const addFiles = (selectedFiles: File[]) => {
  files.value = [...files.value, ...selectedFiles.map(file => ({ id: nextFileId++, file }))]
  resetStatus()
}

const handleRejectedFiles = () => {
  resetStatus()
  statusMessage.value = 'Only PDF files can be added.'
  statusType.value = 'error'
}

const moveFile = (index: number, direction: number) => {
  if (isMerging.value) {
    return
  }
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
  resetStatus()
  reorderMessage.value = `${file.file.name} moved to position ${targetIndex + 1} of ${files.value.length}.`
}

const startDrag = (event: PointerEvent, index: number) => {
  if (!event.isPrimary || event.button !== 0 || isMerging.value) {
    return
  }

  const handle = event.currentTarget as HTMLButtonElement
  const list = handle.closest('ol')

  if (!list) {
    return
  }

  list.setPointerCapture(event.pointerId)
  dragIndex.value = index
}

const dragFile = (event: PointerEvent) => {
  if (dragIndex.value === undefined) {
    return
  }

  const list = event.currentTarget as HTMLOListElement
  const row = document.elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>('[data-file-index]')

  if (!row || row.parentElement !== list) {
    return
  }

  const targetIndex = Number(row.dataset.fileIndex)

  if (targetIndex !== dragIndex.value) {
    moveFile(dragIndex.value, targetIndex - dragIndex.value)
    dragIndex.value = targetIndex
  }
}

const endDrag = () => {
  dragIndex.value = undefined
}

const removeFile = (index: number) => {
  files.value = files.value.filter((_, fileIndex) => fileIndex !== index)
  resetStatus()
}

const clearFiles = () => {
  files.value = []
  resetStatus()
}

const handleMerge = async () => {
  if (files.value.length < 2 || isMerging.value) {
    return
  }

  clearMergeResult()
  const version = ++mergeVersion
  const sourceFiles = files.value.map(entry => entry.file)
  isMerging.value = true
  statusMessage.value = 'Merging PDF files...'
  statusType.value = ''

  try {
    const mergedPdf = await PDFDocument.create()

    for (const file of sourceFiles) {
      if (version !== mergeVersion) return
      const sourceBytes = await file.arrayBuffer()
      if (version !== mergeVersion) return
      const sourcePdf = await PDFDocument.load(sourceBytes)
      if (version !== mergeVersion) return
      const pages = await mergedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices()
      )

      for (const page of pages) {
        mergedPdf.addPage(page)
      }
    }

    const mergedBytes = await mergedPdf.save({
      useObjectStreams: true
    })
    if (version !== mergeVersion) return
    const resultBlob = new Blob(
      [new Uint8Array(mergedBytes)],
      { type: 'application/pdf' }
    )

    resultUrl.value = URL.createObjectURL(resultBlob)
    resultName.value = getPdfFileName(sourceFiles[0]?.name, 'merged')
    statusMessage.value = `PDF merged successfully. Result size: ${formatFileSize(resultBlob.size)}.`
    statusType.value = 'success'
  } catch (error) {
    if (version !== mergeVersion) return
    clearMergeResult()
    statusMessage.value = isEncryptedPdfError(error)
      ? 'One of these PDFs is encrypted. Please replace it with an unencrypted copy.'
      : 'Unable to merge these PDF files. A file may be damaged or unsupported.'
    statusType.value = 'error'
  } finally {
    isMerging.value = false
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
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onBeforeUnmount(() => {
  mergeVersion += 1
  clearMergeResult()
})
</script>
