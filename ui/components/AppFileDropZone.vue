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
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { Upload } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    id?: string
    label: string
    hint: string
    accept?: string
    multiple?: boolean
  }>(),
  {
    multiple: false
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
  const incomingFiles = Array.from(fileList)
  const acceptedFiles = incomingFiles.filter(acceptsFile)
  const rejectedFiles = incomingFiles.filter(file => !acceptsFile(file))

  if (acceptedFiles.length) {
    emit('filesSelected', props.multiple ? acceptedFiles : acceptedFiles.slice(0, 1))
  }

  if (rejectedFiles.length) {
    emit('filesRejected', rejectedFiles)
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
</script>