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
            :loading="isStartingCamera"
            @click="toggleCamera"
          >
            <CameraOff
              v-if="isCameraActive"
              aria-hidden="true"
              class="h-4 w-4"
            />

            <Camera
              v-else
              aria-hidden="true"
              class="h-4 w-4"
            />

            {{ isCameraActive ? 'Stop camera' : 'Use camera' }}
          </AppButton>

          <div
            v-if="isCameraActive"
            class="relative overflow-hidden rounded-2xl border border-neutral-600 bg-black"
          >
            <video
              ref="cameraVideo"
              autoplay
              muted
              playsinline
              class="aspect-video w-full object-cover"
            />

            <div
              aria-hidden="true"
              class="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white"
            />
          </div>
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
              @click="clearResult"
            >
              <X aria-hidden="true" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <p
          v-if="statusMessage"
          :role="statusType === 'error' ? 'alert' : 'status'"
          :aria-live="statusType === 'error' ? 'assertive' : 'polite'"
          class="mt-4 text-sm"
          :class="statusType === 'error' ? 'text-red-300' : 'text-neutral-200'"
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

        <div
          aria-live="polite"
          class="flex min-h-52 items-center justify-center rounded-2xl border border-neutral-300 bg-neutral-100 p-6 text-neutral-700"
        >
          <p
            v-if="scanResult"
            class="w-full break-words text-sm"
          >
            {{ scanResult }}
          </p>

          <div v-else class="text-center">
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
          <AppButton
            :disabled="!scanResult"
            @click="copyResult"
          >
            <Copy aria-hidden="true" class="h-4 w-4" />
            Copy
          </AppButton>

          <AppButton
            variant="secondary"
            :disabled="!isWebLink"
            @click="openResult"
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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef
} from 'vue'
import QrScanner from 'qr-scanner'
import { createWorker } from 'qr-scanner/qr-scanner-worker.min.js'
import {
  Camera,
  CameraOff,
  Copy,
  ExternalLink,
  ScanLine,
  X
} from 'lucide-vue-next'

type StatusType = 'success' | 'error' | ''

QrScanner.createQrEngine = async () => createWorker()

const selectedFileName = ref('')
const scanResult = ref('')
const statusMessage = ref('')
const statusType = ref<StatusType>('')
const cameraVideo = ref<HTMLVideoElement>()
const cameraScanner = shallowRef<QrScanner>()
const isCameraActive = ref(false)
const isStartingCamera = ref(false)
let scanVersion = 0
let imageWorker: Worker | undefined
let cameraListeners: (() => void)[] = []

const releaseImageWorker = (worker: Worker | undefined) => {
  try {
    worker?.terminate()
  } catch {
  }
}

const isWebLink = computed(() => {
  if (!scanResult.value) {
    return false
  }

  try {
    const url = new URL(scanResult.value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
})

const stopCamera = () => {
  scanVersion += 1
  for (const removeListener of cameraListeners) removeListener()
  cameraListeners = []
  releaseImageWorker(imageWorker)
  imageWorker = undefined
  const scanner = cameraScanner.value
  const stream = cameraVideo.value?.srcObject
  cameraScanner.value = undefined
  isCameraActive.value = false
  isStartingCamera.value = false
  try {
    scanner?.destroy()
  } catch {
  }
  if (stream && 'getTracks' in stream) {
    for (const track of (stream as MediaStream).getTracks()) {
      try {
        track.stop()
      } catch {
      }
    }
  }
}

const handleCameraFailure = (version: number) => {
  if (version !== scanVersion) return
  stopCamera()
  statusMessage.value = 'Camera access was lost or denied. Check your browser permissions, then try again. You can still scan an image.'
  statusType.value = 'error'
}

const monitorCamera = (version: number) => {
  for (const removeListener of cameraListeners) removeListener()
  cameraListeners = []
  const stream = cameraVideo.value?.srcObject as MediaStream | null | undefined

  for (const track of stream?.getVideoTracks() ?? []) {
    const ended = () => handleCameraFailure(version)
    track.addEventListener('ended', ended)
    cameraListeners.push(() => track.removeEventListener('ended', ended))
    if (track.readyState === 'ended') {
      handleCameraFailure(version)
      return
    }
  }

  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    void navigator.permissions.query({ name: 'camera' as PermissionName }).then(permission => {
      if (version !== scanVersion) return
      const changed = () => {
        if (permission.state === 'denied') handleCameraFailure(version)
      }
      permission.addEventListener('change', changed)
      cameraListeners.push(() => permission.removeEventListener('change', changed))
      changed()
    }).catch(() => {})
  }
}

const handleCameraResult = (result: QrScanner.ScanResult) => {
  scanResult.value = result.data
  selectedFileName.value = ''
  statusMessage.value = 'QR code scanned successfully.'
  statusType.value = 'success'
  stopCamera()
}

const startCamera = async () => {
  stopCamera()
  const version = scanVersion
  scanResult.value = ''
  selectedFileName.value = ''
  statusMessage.value = ''
  statusType.value = ''
  isStartingCamera.value = true
  isCameraActive.value = true

  await nextTick()
  if (version !== scanVersion) return

  if (!cameraVideo.value) {
    stopCamera()
    return
  }

  try {
    const scanner = new QrScanner(
      cameraVideo.value,
      result => {
        if (version === scanVersion) handleCameraResult(result)
      },
      {
        preferredCamera: 'environment',
        maxScansPerSecond: 10,
        returnDetailedScanResult: true,
        onDecodeError: () => {}
      }
    )

    const start = scanner.start.bind(scanner)
    scanner.start = async () => {
      if (version !== scanVersion) return
      try {
        await start()
        if (version === scanVersion) monitorCamera(version)
      } catch {
        handleCameraFailure(version)
      }
    }
    cameraScanner.value = scanner

    await scanner.start()
    if (version !== scanVersion) return
    statusMessage.value = 'Point the camera at a QR code.'
    statusType.value = ''
  } catch {
    if (version !== scanVersion) return
    stopCamera()
    statusMessage.value = 'Unable to access the camera. Check your browser permissions.'
    statusType.value = 'error'
  } finally {
    if (version === scanVersion) isStartingCamera.value = false
  }
}

const toggleCamera = async () => {
  if (isCameraActive.value) {
    stopCamera()
    statusMessage.value = ''
    statusType.value = ''
    return
  }

  await startCamera()
}

const handleImages = async (files: File[]) => {
  const [file] = files

  if (!file) {
    return
  }

  stopCamera()
  const version = scanVersion
  selectedFileName.value = file.name
  scanResult.value = ''
  statusMessage.value = 'Scanning image...'
  statusType.value = ''

  let worker: Worker | undefined

  try {
    worker = createWorker()
    imageWorker = worker
    const result = await QrScanner.scanImage(file, {
      qrEngine: worker,
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true
    })

    if (version !== scanVersion) return
    scanResult.value = result.data
    statusMessage.value = 'QR code scanned successfully.'
    statusType.value = 'success'
  } catch {
    if (version !== scanVersion) return
    scanResult.value = ''
    statusMessage.value = worker
      ? 'Unable to scan this image. Try a clearer QR image or check browser support.'
      : 'Unable to start the scanner. Check browser support and try again.'
    statusType.value = 'error'
  } finally {
    releaseImageWorker(worker)
    if (imageWorker === worker) imageWorker = undefined
  }
}

const handleRejectedImages = () => {
  clearResult()
  statusMessage.value = 'Only PNG, JPEG, and WebP images can be added.'
  statusType.value = 'error'
}

const copyResult = async () => {
  if (!scanResult.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(scanResult.value)
    statusMessage.value = 'Scan result copied to the clipboard.'
    statusType.value = 'success'
  } catch {
    statusMessage.value = 'Unable to copy the scan result.'
    statusType.value = 'error'
  }
}

const openResult = () => {
  if (!isWebLink.value) {
    return
  }

  window.open(scanResult.value, '_blank', 'noopener,noreferrer')
}

const clearResult = () => {
  stopCamera()
  selectedFileName.value = ''
  scanResult.value = ''
  statusMessage.value = ''
  statusType.value = ''
}

onBeforeUnmount(() => {
  stopCamera()
})
</script>
