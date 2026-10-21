<template>
  <ToolPageLayout
    title="QR Code Scanner"
    description="Scan a QR code from an image or use your device camera."
    category="QR Codes"
  >
    <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="scanner-source-heading">
        <h2
          id="scanner-source-heading"
          class="mb-5 text-lg font-medium"
        >
          Choose a source
        </h2>

        <div class="space-y-4">
          <AppFileDropZone
            label="Choose a QR code image"
            hint="Select or drop a PNG, JPEG, or WebP image"
            accept="image/png,image/jpeg,image/webp"
            @files-selected="handleImages"
            @files-rejected="handleRejectedImages"
          />

          <AppButton
            variant="secondary"
            class="w-full"
            disabled
          >
            <Camera aria-hidden="true" class="h-4 w-4" />
            Use camera
          </AppButton>
        </div>

        <div
          v-if="selectedFileName"
          class="mt-6 rounded-xl border border-neutral-700 bg-neutral-900 p-4"
        >
          <p class="text-sm text-neutral-300">
            Selected image
          </p>

          <div class="mt-2 flex items-center justify-between gap-4">
            <p class="min-w-0 truncate text-white">
              {{ selectedFileName }}
            </p>

            <button
              type="button"
              class="shrink-0 rounded-lg p-2 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              aria-label="Remove selected image"
              @click="clearFile"
            >
              <X aria-hidden="true" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <p class="mt-4 text-sm text-neutral-300">
          Camera scanning is not available yet.
        </p>

        <p
          v-if="statusMessage"
          role="status"
          aria-live="polite"
          class="mt-4 text-sm text-neutral-200"
        >
          {{ statusMessage }}
        </p>
      </section>

      <section
        aria-labelledby="scanner-result-heading"
        class="border-t border-neutral-700 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
      >
        <h2
          id="scanner-result-heading"
          class="mb-4 text-lg font-medium"
        >
          Scan result
        </h2>

        <div class="flex aspect-square items-center justify-center rounded-2xl border border-neutral-300 bg-neutral-100 p-6 text-neutral-600">
          <div class="text-center">
            <ScanLine
              aria-hidden="true"
              class="mx-auto mb-3 h-16 w-16 stroke-1"
            />

            <p class="text-sm">
              Scanned content will appear here.
            </p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <AppButton disabled>
            <Copy aria-hidden="true" class="h-4 w-4" />
            Copy
          </AppButton>

          <AppButton
            variant="secondary"
            disabled
          >
            <ExternalLink aria-hidden="true" class="h-4 w-4" />
            Open link
          </AppButton>
        </div>
      </section>
    </div>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Camera,
  Copy,
  ExternalLink,
  ScanLine,
  X
} from 'lucide-vue-next'

const selectedFileName = ref('')
const statusMessage = ref('')

const handleImages = (files: File[]) => {
  const [file] = files

  if (!file) {
    return
  }

  selectedFileName.value = file.name
  statusMessage.value = 'Image scanning is not available yet.'
}

const handleRejectedImages = () => {
  statusMessage.value = 'Only PNG, JPEG, and WebP images can be added.'
}

const clearFile = () => {
  selectedFileName.value = ''
  statusMessage.value = ''
}
</script>