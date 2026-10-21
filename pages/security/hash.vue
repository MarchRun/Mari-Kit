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
          role="status"
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
          <div class="min-w-0 text-center">
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
          disabled
        >
          <Copy aria-hidden="true" class="h-4 w-4" />
          Copy Hash
        </AppButton>
      </section>
    </form>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Copy, Hash } from 'lucide-vue-next'

type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

const hashText = ref('')
const algorithm = ref<HashAlgorithm>('SHA-256')
const statusMessage = ref('')

watch([hashText, algorithm], () => {
  statusMessage.value = ''
})

const handleGenerate = () => {
  statusMessage.value = 'Hash generation is not available yet.'
}

const clearForm = () => {
  hashText.value = ''
  algorithm.value = 'SHA-256'
  statusMessage.value = ''
}
</script>