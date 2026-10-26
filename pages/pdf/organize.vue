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
              Drag handles to reorder pages. Select pages to rotate or remove them.
            </p>
          </div>

          <p class="text-sm text-neutral-300">
            {{ selectedPages.length }} of {{ pages.length }} pages selected
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AppButton
            variant="secondary"
            :disabled="!selectedPages.length || isBusy"
            @click="rotatePages(-90)"
          >
            <RotateCcw aria-hidden="true" class="h-4 w-4" />
            Rotate left
          </AppButton>

          <AppButton
            variant="secondary"
            :disabled="!selectedPages.length || isBusy"
            @click="rotatePages(90)"
          >
            <RotateCw aria-hidden="true" class="h-4 w-4" />
            Rotate right
          </AppButton>

          <AppButton
            variant="secondary"
            class="col-span-2 sm:col-span-1"
            :disabled="!selectedPages.length || selectedPages.length === pages.length || isBusy"
            @click="removePages"
          >
            <Trash2 aria-hidden="true" class="h-4 w-4" />
            Remove
          </AppButton>
        </div>

        <div v-if="pages.length" class="mt-5 flex flex-wrap gap-3">
          <AppButton variant="secondary" :disabled="isBusy || selectedPages.length === pages.length" @click="selectedPages = pages.map(page => page.index)">Select all</AppButton>
          <AppButton variant="secondary" :disabled="isBusy || !selectedPages.length" @click="selectedPages = []">Unselect all</AppButton>
        </div>
        <ol
          v-if="pages.length"
          class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3"
          @pointermove="dragPage"
          @pointerup="endDrag"
          @pointercancel="endDrag"
          @lostpointercapture="endDrag"
        >
          <li
            v-for="(page, position) in visiblePages"
            :key="page.index"
            :data-page-position="position"
            class="min-w-0 rounded-xl border bg-neutral-900 p-3"
            :class="dragIndex === position || selectedPages.includes(page.index) ? 'border-white' : 'border-neutral-700'"
          >
            <label class="block cursor-pointer">
              <span class="mb-3 flex min-h-11 items-center gap-2 text-sm">
                <input v-model="selectedPages" type="checkbox" :value="page.index" :disabled="isBusy" class="h-4 w-4 accent-white">
                Page {{ page.index + 1 }}
              </span>
              <span class="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-neutral-800 p-3">
                <img v-if="page.preview" :src="page.preview" alt="" class="max-h-full max-w-full object-contain" :style="{ transform: `rotate(${page.rotation}deg)` }">
                <FileText v-else aria-hidden="true" class="h-10 w-10 text-neutral-300" />
              </span>
            </label>
            <button
              type="button"
              class="mt-3 flex min-h-11 w-full touch-none select-none items-center justify-center gap-2 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              :class="dragIndex === position ? 'cursor-grabbing' : 'cursor-grab'"
              :disabled="isBusy"
              :aria-label="`Reorder page ${page.index + 1}, position ${position + 1}. Use arrow keys to move.`"
              @pointerdown="startDrag($event, position)"
              @keydown.up.prevent="movePage(position, position - 1)"
              @keydown.left.prevent="movePage(position, position - 1)"
              @keydown.down.prevent="movePage(position, position + 1)"
              @keydown.right.prevent="movePage(position, position + 1)"
            >
              <GripVertical aria-hidden="true" class="h-4 w-4" />
              Move
            </button>
          </li>
        </ol>
        <AppButton
          v-if="pages.length > visibleCount"
          variant="secondary"
          class="mt-5 w-full"
          :loading="isLoading"
          :disabled="isExporting"
          @click="loadMorePages"
        >
          Load more pages
        </AppButton>
        <div v-if="!pages.length" class="mt-5 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-600 bg-neutral-900 p-8 text-center">
          <div>
            <LayoutGrid
              aria-hidden="true"
              class="mx-auto mb-3 h-12 w-12 text-neutral-300"
            />

            <p class="font-medium">
              {{ isLoading ? 'Reading PDF pages...' : 'Choose a PDF to view its pages.' }}
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
            :disabled="!pages.length || isBusy"
            :loading="isExporting"
            @click="downloadPdf"
        >
          <Download aria-hidden="true" class="h-4 w-4" />
          Download organized PDF
        </AppButton>
      </div>

      <p
        v-if="statusMessage"
        :role="hasError ? 'alert' : 'status'"
        aria-live="polite"
        class="text-sm"
        :class="hasError ? 'text-red-300' : 'text-neutral-200'"
      >
        {{ statusMessage }}
      </p>
    </div>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { degrees, PDFDocument } from 'pdf-lib'
import { getPdfFileName } from '~/utils/downloadFileName'
import { isEncryptedPdfError } from '~/utils/pdf/isEncryptedPdfError'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  Download,
  FileText,
  GripVertical,
  LayoutGrid,
  RotateCcw,
  RotateCw,
  Trash2,
  X
} from 'lucide-vue-next'

const selectedFile = ref<File>()
const statusMessage = ref('')
const hasError = ref(false)
const pages = ref<{ index: number; rotation: number; preview: string }[]>([])
const visibleCount = ref(12)
const visiblePages = computed(() => pages.value.slice(0, visibleCount.value))
const selectedPages = ref<number[]>([])
const isLoading = ref(false)
const isExporting = ref(false)
const isBusy = computed(() => isLoading.value || isExporting.value)
const dragIndex = ref<number>()
let sourceBytes: ArrayBuffer | undefined
let version = 0
let downloadUrl = ''
let previewTask: ReturnType<typeof import('pdfjs-dist')['getDocument']> | undefined
let previewDocument: import('pdfjs-dist').PDFDocumentProxy | undefined

const renderPreviews = async (
  document: import('pdfjs-dist').PDFDocumentProxy,
  entries: typeof pages.value,
  currentVersion: number
) => {
  for (const entry of entries) {
    if (currentVersion !== version) return
    if (entry.preview) continue
    const page = await document.getPage(entry.index + 1)
    try {
      const original = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: 240 / Math.max(original.width, original.height) })
      const canvas = window.document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      await page.render({ canvas, viewport }).promise
      if (currentVersion !== version) return
      entry.preview = canvas.toDataURL('image/png')
    } finally {
      page.cleanup()
    }
  }
}

const loadMorePages = async () => {
  if (!previewDocument || isBusy.value) return
  const currentVersion = version
  const nextCount = Math.min(visibleCount.value + 12, pages.value.length)
  isLoading.value = true
  hasError.value = false
  try {
    await renderPreviews(previewDocument, pages.value.slice(0, nextCount), currentVersion)
    if (currentVersion !== version) return
    visibleCount.value = nextCount
    statusMessage.value = `${nextCount} of ${pages.value.length} pages displayed.`
  } catch {
    if (currentVersion !== version) return
    hasError.value = true
    statusMessage.value = 'Unable to load more previews. Try again or download the organized PDF.'
  } finally {
    if (currentVersion === version) isLoading.value = false
  }
}

const handleFiles = async (files: File[]) => {
  if (isExporting.value) return
  const [file] = files

  if (!file) {
    return
  }

  clearFile()
  selectedFile.value = file
  const currentVersion = version
  isLoading.value = true
  statusMessage.value = 'Reading PDF pages...'

  let loadingTask: ReturnType<typeof import('pdfjs-dist')['getDocument']> | undefined
  let keepPreview = false

  try {
    const bytes = await file.arrayBuffer()
    await PDFDocument.load(bytes)
    const pdfjs = await import('pdfjs-dist')
    if (currentVersion !== version) return
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(bytes.slice(0)),
      useSystemFonts: true
    })
    previewTask = loadingTask
    const document = await loadingTask.promise
    const previews = Array.from({ length: document.numPages }, (_, index) => ({ index, rotation: 0, preview: '' }))
    await renderPreviews(document, previews.slice(0, 12), currentVersion)

    if (currentVersion !== version) return
    sourceBytes = bytes
    previewDocument = document
    keepPreview = true
    pages.value = previews
    statusMessage.value = `${previews.length} pages ready to organize.`
  } catch (error) {
    if (currentVersion === version) {
      hasError.value = true
      statusMessage.value = isEncryptedPdfError(error)
        ? 'This PDF is encrypted. Please choose an unencrypted copy.'
        : 'Unable to read this PDF. It may be damaged or unsupported.'
    }
  } finally {
    if (currentVersion === version) isLoading.value = false
    if (!keepPreview && previewTask === loadingTask) previewTask = undefined
    try {
      if (!keepPreview) await loadingTask?.destroy()
    } catch {
      if (currentVersion === version) {
        hasError.value = true
        statusMessage.value = 'Unable to release the PDF preview worker. Clear the document and try again.'
      }
    }
  }
}

const handleRejectedFiles = () => {
  statusMessage.value = 'Only PDF files can be added.'
  hasError.value = true
}

const clearFile = () => {
  version += 1
  const task = previewTask
  previewTask = undefined
  previewDocument = undefined
  visibleCount.value = 12
  if (task) {
    void Promise.resolve().then(() => task.destroy()).catch(() => {})
  }
  sourceBytes = undefined
  pages.value = []
  selectedPages.value = []
  dragIndex.value = undefined
  isLoading.value = false
  hasError.value = false
  if (downloadUrl) URL.revokeObjectURL(downloadUrl)
  downloadUrl = ''
  selectedFile.value = undefined
  statusMessage.value = ''
}

const rotatePages = (angle: number) => {
  for (const page of pages.value) {
    if (selectedPages.value.includes(page.index)) {
      page.rotation = (page.rotation + angle + 360) % 360
    }
  }
  hasError.value = false
  statusMessage.value = 'Selected pages rotated.'
}

const removePages = async () => {
  if (isBusy.value || selectedPages.value.length === pages.value.length) return
  pages.value = pages.value.filter(page => !selectedPages.value.includes(page.index))
  selectedPages.value = []
  hasError.value = false
  statusMessage.value = 'Selected pages removed. The original PDF is unchanged.'
  if (!previewDocument) return
  const currentVersion = version
  isLoading.value = true
  try {
    await renderPreviews(previewDocument, visiblePages.value, currentVersion)
  } catch {
    if (currentVersion === version) {
      hasError.value = true
      statusMessage.value = 'Pages removed, but some previews could not be loaded. You can still download the organized PDF.'
    }
  } finally {
    if (currentVersion === version) isLoading.value = false
  }
}

const movePage = (from: number, to: number) => {
  if (isBusy.value || to < 0 || to >= pages.value.length || from === to) return
  const reordered = [...pages.value]
  const [page] = reordered.splice(from, 1)
  if (!page) return
  reordered.splice(to, 0, page)
  pages.value = reordered
  hasError.value = false
  statusMessage.value = `Page ${page.index + 1} moved to position ${to + 1}.`
}

const startDrag = (event: PointerEvent, index: number) => {
  if (!event.isPrimary || event.button !== 0 || isBusy.value) return
  const list = (event.currentTarget as HTMLElement).closest('ol')
  if (!list) return
  list.setPointerCapture(event.pointerId)
  dragIndex.value = index
}

const dragPage = (event: PointerEvent) => {
  if (dragIndex.value === undefined) return
  const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-page-position]')
  if (!row || row.parentElement !== event.currentTarget) return
  const target = Number(row.dataset.pagePosition)
  movePage(dragIndex.value, target)
  dragIndex.value = target
}

const endDrag = () => {
  dragIndex.value = undefined
}

const downloadPdf = async () => {
  if (!sourceBytes || !pages.value.length || isBusy.value) return
  isExporting.value = true
  const currentVersion = version
  try {
    const source = await PDFDocument.load(sourceBytes)
    const output = await PDFDocument.create()
    const copied = await output.copyPages(source, pages.value.map(page => page.index))
    copied.forEach((page, index) => {
      page.setRotation(degrees((page.getRotation().angle + pages.value[index]!.rotation) % 360))
      output.addPage(page)
    })
    const bytes = await output.save()
    if (currentVersion !== version) return
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    downloadUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = getPdfFileName(selectedFile.value?.name, 'organized')
    link.click()
    hasError.value = false
    statusMessage.value = 'Organized PDF ready to download.'
  } catch {
    if (currentVersion === version) {
      hasError.value = true
      statusMessage.value = 'Unable to export this PDF. Try another document.'
    }
  } finally {
    isExporting.value = false
  }
}

onBeforeUnmount(clearFile)

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
