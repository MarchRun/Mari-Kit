<template>
  <div
    class="relative"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.self="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <input
      :id="inputId"
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="peer sr-only"
      @change="handleInput"
    >

    <label
      :for="inputId"
      class="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center text-black transition-colors peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-white"
      :class="isDragging
        ? 'border-black bg-neutral-300'
        : 'border-neutral-400 bg-neutral-100 hover:border-black hover:bg-neutral-200'"
    >
      <Upload
        aria-hidden="true"
        class="mb-3 h-8 w-8"
      />

      <span class="font-medium">
        {{ isDragging ? 'Drop files here' : label }}
      </span>

      <span class="mt-1 text-sm text-neutral-600">
        {{ hint }}
      </span>
      <span class="mt-2 text-sm text-neutral-600">
        Or paste a copied file with Ctrl+V / ⌘V when supported by your browser.
      </span>
      <span class="mt-2 text-sm text-neutral-600">
        Maximum 100 MB per file{{ multiple ? ' and 100 MB combined' : '' }}.
      </span>
    </label>
    <p v-if="sizeError" role="alert" class="mt-3 text-sm text-red-300">
      {{ sizeError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { Upload } from 'lucide-vue-next'
import { getFileSizeError } from '~/utils/fileLimits'

const props = withDefaults(
  defineProps<{
    id?: string
    label: string
    hint: string
    accept?: string
    multiple?: boolean
    currentTotalBytes?: number
  }>(),
  {
    multiple: false,
    currentTotalBytes: 0
  }
)

const emit = defineEmits<{
  filesSelected: [files: File[]]
  filesRejected: [files: File[]]
}>()

const generatedId = useId()
const inputId = props.id ?? generatedId
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const sizeError = ref('')

const acceptsFile = (file: File) => {
  if (!props.accept) {
    return true
  }

  return props.accept.split(',').some(value => {
    const rule = value.trim().toLowerCase()
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()

    if (rule.startsWith('.')) {
      return fileName.endsWith(rule)
    }

    if (rule.endsWith('/*')) {
      return fileType.startsWith(rule.slice(0, -1))
    }

    return fileType === rule
  })
}

const processFiles = (fileList: FileList | File[]) => {
  if (fileInput.value?.matches(':disabled')) {
    return
  }

  sizeError.value = ''
  const incomingFiles = Array.from(fileList)
  const acceptedFiles = incomingFiles.filter(acceptsFile)
  const rejectedFiles = incomingFiles.filter(file => !acceptsFile(file))
  if (rejectedFiles.length) {
    emit('filesRejected', rejectedFiles)
    return
  }
  const selectedFiles = props.multiple ? acceptedFiles : acceptedFiles.slice(0, 1)
  sizeError.value = getFileSizeError(selectedFiles, props.multiple ? props.currentTotalBytes : 0)

  if (sizeError.value) {
    return
  }

  if (acceptedFiles.length) {
    emit('filesSelected', selectedFiles)
  }

}

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement

  if (input.files) {
    processFiles(input.files)
  }

  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false

  if (event.dataTransfer?.files) {
    processFiles(event.dataTransfer.files)
  }
}

const handlePaste = (event: ClipboardEvent) => {
  if (event.defaultPrevented || fileInput.value?.matches(':disabled')) {
    return
  }

  const target = event.target

  if (target instanceof HTMLElement && (
    target.isContentEditable || target.closest('input:not([type="file"]), textarea, select, [role="textbox"]')
  )) {
    return
  }

  const clipboard = event.clipboardData

  if (!clipboard) {
    return
  }

  const files = Array.from(clipboard.files)

  if (!files.length) {
    for (const item of Array.from(clipboard.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()

        if (file) {
          files.push(file)
        }
      }
    }
  }

  if (!files.length) {
    return
  }

  event.preventDefault()
  processFiles(files)
}

onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>
