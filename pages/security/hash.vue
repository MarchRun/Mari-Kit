<template>
  <ToolPageLayout
    title="Hash Generator"
    description="Generate a SHA hash from text without sending it to a server."
    category="Privacy and Security"
  >
    <form
      class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]"
      @submit.prevent="handleGenerate"
    >
      <div class="space-y-6">
        <div>
          <label
            for="hash-text"
            class="mb-2 block text-sm font-medium text-neutral-200"
          >
            Text
          </label>

          <textarea
            id="hash-text"
            v-model="hashText"
            name="hashText"
            rows="8"
            placeholder="Enter the text you want to hash"
            spellcheck="false"
            required
            class="w-full resize-y rounded-xl border border-neutral-600 bg-neutral-950 px-4 py-3 text-white caret-white placeholder:text-neutral-400 transition-colors hover:border-neutral-400 focus:border-white focus:outline-none"
          />

          <p class="mt-2 text-sm text-neutral-300">
            Your text remains in this browser.
          </p>
        </div>

        <div>
          <label
            for="hash-algorithm"
            class="mb-2 block text-sm font-medium text-neutral-200"
          >
            Algorithm
          </label>

          <select
            id="hash-algorithm"
            v-model="algorithm"
            name="algorithm"
            class="min-h-12 w-full rounded-xl border border-neutral-600 bg-neutral-950 px-4 py-3 text-white transition-colors hover:border-neutral-400 focus:border-white focus:outline-none"
          >
            <option value="SHA-256">
              SHA-256
            </option>

            <option value="SHA-384">
              SHA-384
            </option>

            <option value="SHA-512">
              SHA-512
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          <AppButton
            type="submit"
            class="w-full sm:w-auto"
            :disabled="!hashText"
            :loading="isGenerating"
          >
            <Hash aria-hidden="true" class="h-4 w-4" />
            Generate Hash
          </AppButton>

          <AppButton
            variant="secondary"
            class="w-full sm:w-auto"
            :disabled="!hashText"
            @click="clearForm"
          >
            Clear
          </AppButton>
        </div>

        <p
          v-if="statusMessage"
          :role="hasError ? 'alert' : 'status'"
          aria-live="polite"
          class="text-sm text-neutral-200"
        >
          {{ statusMessage }}
        </p>
      </div>

      <section
        aria-labelledby="hash-result-heading"
        class="border-t border-neutral-700 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
      >
        <h2
          id="hash-result-heading"
          class="mb-4 text-lg font-medium"
        >
          Hash result
        </h2>

        <div
          aria-live="polite"
          class="flex min-h-52 items-center justify-center rounded-2xl border border-neutral-300 bg-neutral-100 p-6 text-neutral-600"
        >
          <p v-if="hashResult" class="min-w-0 select-all break-all text-sm text-neutral-950">{{ hashResult }}</p>
          <div v-else class="min-w-0 text-center">
            <Hash
              aria-hidden="true"
              class="mx-auto mb-3 h-12 w-12 stroke-1"
            />

            <p class="text-sm">
              Your {{ algorithm }} hash will appear here.
            </p>
          </div>
        </div>

        <AppButton
          class="mt-4 w-full"
          :disabled="!hashResult"
          @click="copyHash"
        >
          <Copy aria-hidden="true" class="h-4 w-4" />
          Copy Hash
        </AppButton>
      </section>
    </form>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { Copy, Hash } from 'lucide-vue-next'

type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

const hashText = ref('')
const algorithm = ref<HashAlgorithm>('SHA-256')
const statusMessage = ref('')
const hashResult = ref('')
const hasError = ref(false)
const isGenerating = ref(false)
let generation = 0

watch([hashText, algorithm], () => {
  statusMessage.value = ''
  hashResult.value = ''
  hasError.value = false
  generation += 1
  isGenerating.value = false
}, { flush: 'sync' })

const handleGenerate = async () => {
  if (!hashText.value || isGenerating.value) return
  const currentGeneration = ++generation
  hashResult.value = ''
  hasError.value = false
  isGenerating.value = true
  statusMessage.value = 'Generating hash...'

  try {
    const bytes = new TextEncoder().encode(hashText.value)
    const digest = await crypto.subtle.digest(algorithm.value, bytes)
    if (currentGeneration !== generation) return
    hashResult.value = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    statusMessage.value = 'Hash generated.'
  } catch {
    if (currentGeneration !== generation) return
    hasError.value = true
    statusMessage.value = 'Unable to generate a hash. Use a browser with Web Crypto support over HTTPS or localhost.'
  } finally {
    if (currentGeneration === generation) isGenerating.value = false
  }
}

const copyHash = async () => {
  if (!hashResult.value) return
  try {
    await navigator.clipboard.writeText(hashResult.value)
    hasError.value = false
    statusMessage.value = 'Hash copied to the clipboard.'
  } catch {
    hasError.value = true
    statusMessage.value = 'Unable to copy. Select the hash and copy it manually.'
  }
}

onBeforeUnmount(() => { generation += 1 })

const clearForm = () => {
  hashText.value = ''
  algorithm.value = 'SHA-256'
  statusMessage.value = ''
}
</script>
