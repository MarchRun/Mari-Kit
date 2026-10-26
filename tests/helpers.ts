import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick, type Component } from 'vue'
import { vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import AppButton from '../ui/components/AppButton.vue'
import AppInput from '../ui/components/AppInput.vue'
import AppFileDropZone from '../ui/components/AppFileDropZone.vue'

export const mountTool = (component: Component) => mount(component, {
  attachTo: document.body,
  global: {
    components: { AppButton, AppInput, AppFileDropZone },
    stubs: { ToolPageLayout: { template: '<main><slot /></main>' } }
  }
})

export const button = (wrapper: VueWrapper, text: string) => {
  const result = wrapper.findAll('button').find(item => item.text() === text)
  if (!result) throw new Error(`Button not found: ${text}`)
  return result
}

export const chooseFiles = async (wrapper: VueWrapper, files: File[]) => {
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: files })
  await input.trigger('change')
  await flushPromises()
}

export const makePdf = async (name = 'source.pdf', widths = [301, 302, 303, 304, 305]) => {
  const pdf = await PDFDocument.create()
  for (const width of widths) pdf.addPage([width, 500])
  const bytes = await pdf.save()
  const file = new File([new Uint8Array(bytes)], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'arrayBuffer', { value: async () => Uint8Array.from(bytes).buffer })
  return file
}

export const readBlob = (blob: Blob): Promise<ArrayBuffer> => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result as ArrayBuffer)
  reader.onerror = () => reject(reader.error)
  reader.readAsArrayBuffer(blob)
})

export const captureDownloads = () => {
  const blobs = new Map<string, Blob>()
  const downloads: { name: string; url: string }[] = []
  const create = vi.fn((blob: Blob) => {
    const url = `blob:test-${blobs.size}`
    blobs.set(url, blob)
    return url
  })
  const revoke = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: create })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revoke })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, url: this.href })
  })
  return {
    blobs, downloads, create, revoke,
    pdf: async (index = downloads.length - 1) => {
      const download = downloads[index]!
      return PDFDocument.load(new Uint8Array(await readBlob(blobs.get(download.url)!)))
    }
  }
}

export const pasteFiles = (target: EventTarget, files: File[], itemsOnly = false) => {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: {
      files: itemsOnly ? [] : files,
      items: files.map(file => ({ kind: 'file', getAsFile: () => file }))
    }
  })
  target.dispatchEvent(event)
  return event
}

export const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

export const pointer = async (element: Element, type: string, properties: Record<string, unknown> = {}) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  for (const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value })
  element.dispatchEvent(event)
  await nextTick()
}
