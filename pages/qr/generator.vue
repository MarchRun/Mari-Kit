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
        />

        <div class="flex flex-col gap-3 sm:flex-row">
          <AppButton
            type="submit"
            class="w-full sm:w-auto"
            :disabled="!qrText.trim()"
          >
            <QrCode aria-hidden="true" class="h-4 w-4" />
            Generate QR Code
          </AppButton>

          <AppButton
            variant="secondary"
            class="w-full sm:w-auto"
            :disabled="!qrText"
            @click="handleReset"
          >
            <RotateCcw aria-hidden="true" class="h-4 w-4" />
            Reset
          </AppButton>
        </div>

        <p
          v-if="statusMessage"
          role="status"
          aria-live="polite"
          class="text-sm text-neutral-300"
        >
          {{ statusMessage }}
        </p>
      </div>

      <div class="border-t border-neutral-700 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <h2 class="mb-4 text-lg font-medium">
          Preview
        </h2>

        <div class="flex aspect-square w-full items-center justify-center rounded-2xl border border-neutral-300 bg-neutral-100 p-6 text-neutral-600">
          <div class="text-center">
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
          disabled
        >
          <Download aria-hidden="true" class="h-4 w-4" />
          Download
        </AppButton>
      </div>
    </form>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Download, QrCode, RotateCcw } from 'lucide-vue-next'

const qrText = ref('')
const statusMessage = ref('')

watch(qrText, () => {
  statusMessage.value = ''
})

const handleGenerate = () => {
  statusMessage.value = 'QR code generation is not available yet.'
}

const handleReset = () => {
  qrText.value = ''
}
</script>