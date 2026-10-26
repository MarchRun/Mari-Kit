<template>
  <ToolPageLayout
    title="QR Code Generator"
    description="Create a QR code from text or a URL and download the result."
    category="QR Codes"
  >
    <form
      class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]"
      @submit.prevent="handleGenerate"
    >
      <div class="space-y-6">
        <AppInput
          v-model="qrText"
          label="Text or URL"
          name="qrContent"
          placeholder="https://example.com"
          hint="Enter up to 2,048 characters."
          autocomplete="off"
          maxlength="2048"
          required
          :disabled="isGenerating"
        />

        <div class="flex flex-col gap-3 sm:flex-row">
          <AppButton
            type="submit"
            class="w-full sm:w-auto"
            :disabled="!qrText.trim()"
            :loading="isGenerating"
          >
            <QrCode aria-hidden="true" class="h-4 w-4" />
            Generate QR Code
          </AppButton>

          <AppButton
            variant="secondary"
            class="w-full sm:w-auto"
            :disabled="!qrText && !qrDataUrl"
            @click="handleReset"
          >
            <RotateCcw aria-hidden="true" class="h-4 w-4" />
            Reset
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
      </div>

      <section
        aria-labelledby="qr-preview-heading"
        class="border-t border-neutral-700 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
      >
        <h2
          id="qr-preview-heading"
          class="mb-4 text-lg font-medium"
        >
          Preview
        </h2>

        <div
          aria-live="polite"
          class="flex aspect-square w-full items-center justify-center rounded-2xl border border-neutral-300 bg-neutral-100 p-6 text-neutral-600"
        >
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="Generated QR code"
            class="h-full w-full object-contain"
          >

          <div v-else class="text-center">
            <QrCode
              aria-hidden="true"
              class="mx-auto mb-3 h-16 w-16 stroke-1"
            />

            <p class="text-sm">
              Your QR code will appear here.
            </p>
          </div>
        </div>

        <AppButton
          class="mt-4 w-full"
          :disabled="!qrDataUrl"
          @click="handleDownload"
        >
          <Download aria-hidden="true" class="h-4 w-4" />
          Download PNG
        </AppButton>
      </section>
    </form>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { getQrFileName } from '~/utils/downloadFileName'
import { Download, QrCode, RotateCcw } from 'lucide-vue-next'

type StatusType = 'success' | 'error' | ''

const qrText = ref('')
const qrDataUrl = ref('')
const isGenerating = ref(false)
const statusMessage = ref('')
const statusType = ref<StatusType>('')
let generation = 0

watch(qrText, () => {
  generation += 1
  qrDataUrl.value = ''
  statusMessage.value = ''
  statusType.value = ''
}, { flush: 'sync' })

const handleGenerate = async () => {
  const content = qrText.value.trim()

  if (!content) {
    return
  }

  isGenerating.value = true
  const version = ++generation
  statusMessage.value = ''
  statusType.value = ''

  try {
    const dataUrl = await QRCode.toDataURL(content, {
      width: 512,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    if (version !== generation) return
    qrDataUrl.value = dataUrl

    statusMessage.value = 'QR code generated successfully.'
    statusType.value = 'success'
  } catch {
    if (version !== generation) return
    qrDataUrl.value = ''
    statusMessage.value = 'Unable to generate the QR code. Try using shorter text.'
    statusType.value = 'error'
  } finally {
    isGenerating.value = false
  }
}

const handleDownload = () => {
  if (!qrDataUrl.value) {
    return
  }

  const link = document.createElement('a')
  link.href = qrDataUrl.value
  link.download = getQrFileName()
  link.click()
}

const handleReset = () => {
  generation += 1
  qrText.value = ''
  qrDataUrl.value = ''
  statusMessage.value = ''
  statusType.value = ''
}

onBeforeUnmount(() => { generation += 1 })
</script>
