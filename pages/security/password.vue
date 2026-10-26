<template>
  <ToolPageLayout
    title="Password Generator"
    description="Create a customizable random password using your browser."
    category="Privacy and Security"
  >
    <form class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]" @submit.prevent="handleGenerate">
      <div class="space-y-8">
        <AppInput
          v-model="passwordLength"
          label="Password length"
          name="passwordLength"
          type="number"
          min="8"
          max="128"
          inputmode="numeric"
          hint="Choose a length between 8 and 128 characters."
          required
        />

        <fieldset>
          <legend class="text-lg font-medium">
            Character types
          </legend>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label
              v-for="option in characterOptions"
              :key="option.key"
              class="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 p-4 transition hover:border-neutral-500"
            >
              <input
                v-model="option.enabled"
                type="checkbox"
                class="h-4 w-4 accent-white"
              >

              <span>{{ option.label }}</span>
            </label>
          </div>

          <p
            v-if="!hasSelectedCharacters"
            class="mt-3 text-sm text-red-300"
          >
            Select at least one character type.
          </p>
        </fieldset>

        <div class="flex flex-col gap-3 sm:flex-row">
          <AppButton
            type="submit"
            class="w-full sm:w-auto"
            :disabled="!canGenerate"
          >
            <KeyRound aria-hidden="true" class="h-4 w-4" />
            Generate Password
          </AppButton>

          <AppButton
            variant="secondary"
            class="w-full sm:w-auto"
            @click="resetSettings"
          >
            <RotateCcw aria-hidden="true" class="h-4 w-4" />
            Reset
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
        aria-labelledby="password-result-heading"
        class="border-t border-neutral-700 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
      >
        <h2
          id="password-result-heading"
          class="mb-4 text-lg font-medium"
        >
          Generated password
        </h2>

        <div
          aria-live="polite"
          class="flex min-h-52 items-center justify-center rounded-2xl border border-neutral-300 bg-neutral-100 p-6 text-center text-neutral-600"
        >
          <p v-if="password" class="min-w-0 select-all break-all text-lg text-neutral-950">{{ password }}</p>
          <div v-else>
            <KeyRound
              aria-hidden="true"
              class="mx-auto mb-3 h-12 w-12 stroke-1"
            />

            <p class="text-sm">
              Your generated password will appear here.
            </p>
          </div>
        </div>

        <AppButton
          class="mt-4 w-full"
          :disabled="!password"
          @click="copyPassword"
        >
          <Copy aria-hidden="true" class="h-4 w-4" />
          Copy Password
        </AppButton>
      </section>
    </form>
  </ToolPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { generatePassword } from '~/utils/security/passwordGenerator'
import { Copy, KeyRound, RotateCcw } from 'lucide-vue-next'

const passwordLength = ref('16')
const statusMessage = ref('')
const password = ref('')
const hasError = ref(false)

const characterOptions = reactive([
  {
    key: 'lowercase',
    label: 'Lowercase letters',
    enabled: true
  },
  {
    key: 'uppercase',
    label: 'Uppercase letters',
    enabled: true
  },
  {
    key: 'numbers',
    label: 'Numbers',
    enabled: true
  },
  {
    key: 'symbols',
    label: 'Symbols',
    enabled: true
  }
])

const parsedLength = computed(() => Number(passwordLength.value))

const hasSelectedCharacters = computed(() =>
  characterOptions.some(option => option.enabled)
)

const hasValidLength = computed(() =>
  Number.isInteger(parsedLength.value)
  && parsedLength.value >= 8
  && parsedLength.value <= 128
)

const canGenerate = computed(() =>
  hasValidLength.value && hasSelectedCharacters.value
)

const handleGenerate = () => {
  if (!canGenerate.value) return
  password.value = ''
  hasError.value = false

  try {
    password.value = generatePassword(parsedLength.value, characterOptions.filter(option => option.enabled).map(option => option.key))
    statusMessage.value = 'Password generated.'
  } catch {
    hasError.value = true
    statusMessage.value = 'Unable to generate a password. Your browser must support secure random generation.'
  }
}

const copyPassword = async () => {
  if (!password.value) return
  try {
    await navigator.clipboard.writeText(password.value)
    hasError.value = false
    statusMessage.value = 'Password copied to the clipboard.'
  } catch {
    hasError.value = true
    statusMessage.value = 'Unable to copy. Select the password and copy it manually.'
  }
}

watch([passwordLength, characterOptions], () => {
  password.value = ''
  statusMessage.value = ''
  hasError.value = false
}, { deep: true, flush: 'sync' })

const resetSettings = () => {
  passwordLength.value = '16'

  for (const option of characterOptions) {
    option.enabled = true
  }

  statusMessage.value = ''
  password.value = ''
  hasError.value = false
}
</script>
