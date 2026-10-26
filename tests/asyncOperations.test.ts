import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { computed, ref, shallowRef, watch } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { getFileSizeError, maxFileBytes } from '../utils/fileLimits'
import { EncryptedPDFError } from 'pdf-lib'
import { isEncryptedPdfError } from '../utils/pdf/isEncryptedPdfError'
import { getPdfFileName, getQrFileName } from '../utils/downloadFileName'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

const loadTool = (path: string, names: string, overrides: Record<string, unknown> = {}) => {
  const contents = readFileSync(resolve(process.cwd(), path), 'utf8')
  const script = contents.split('<script setup lang="ts">')[1]!.split('</script>')[0]!
  const source = stripTypeScriptTypes(script
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"]\s*;?/gm, '')
    .replace("await import('pdfjs-dist')", 'pdfjsMock'))
  let cleanup = () => {}
  const bindings = {
    ref, shallowRef, computed, watch, isEncryptedPdfError, getPdfFileName, getQrFileName,
    nextTick: async () => {},
    onBeforeUnmount: (handler: () => void) => { cleanup = handler },
    URL: { createObjectURL: vi.fn(() => 'blob:result'), revokeObjectURL: vi.fn() },
    ...overrides
  }
  const tool = new Function(...Object.keys(bindings), `${source}; return {${names}}`)(...Object.values(bindings))
  return { tool, cleanup: () => cleanup(), bindings }
}

const pdfDocument = () => ({
  create: async () => ({
    copyPages: async () => [{}],
    addPage: () => {},
    save: async () => new Uint8Array([1])
  }),
  load: async () => ({ getPageCount: () => 1, getPageIndices: () => [0] })
})

describe('PDF operation invalidation', () => {
  it('identifies an encrypted source in Organizer', async () => {
    const { tool } = loadTool('pages/pdf/organize.vue', 'handleFiles,statusMessage,isLoading', {
      PDFDocument: { load: async () => { throw new EncryptedPDFError() } }
    })
    await tool.handleFiles([{ arrayBuffer: async () => new ArrayBuffer(0) }])
    expect(tool.statusMessage.value).toBe('This PDF is encrypted. Please choose an unencrypted copy.')
    expect(tool.isLoading.value).toBe(false)
  })

  it('identifies an encrypted source in Splitter without publishing results', async () => {
    const { tool } = loadTool('pages/pdf/split.vue', 'handleFiles,handleSplit,pageRange,statusMessage,results', {
      PDFDocument: { load: async () => { throw new EncryptedPDFError() } }
    })
    tool.handleFiles([{ arrayBuffer: async () => new ArrayBuffer(0) }])
    tool.pageRange.value = '1'
    await tool.handleSplit()
    expect(tool.statusMessage.value).toBe('This PDF is encrypted. Please choose an unencrypted copy.')
    expect(tool.results.value).toEqual([])
  })

  it('identifies an encrypted source in Merger without publishing results', async () => {
    const pdf = pdfDocument()
    const { tool } = loadTool('pages/pdf/merge.vue', 'addFiles,handleMerge,statusMessage,resultUrl', {
      PDFDocument: { ...pdf, load: async () => { throw new EncryptedPDFError() } }
    })
    tool.addFiles(Array.from({ length: 2 }, () => ({ arrayBuffer: async () => new ArrayBuffer(0) })))
    await tool.handleMerge()
    expect(tool.statusMessage.value).toBe('One of these PDFs is encrypted. Please replace it with an unencrypted copy.')
    expect(tool.resultUrl.value).toBe('')
  })
  it('keeps identical file selections independently reorderable', () => {
    const { tool } = loadTool('pages/pdf/merge.vue', 'addFiles,moveFile,removeFile,files')
    const file = { name: 'same.pdf', size: 1, lastModified: 1 }
    tool.addFiles([file, file])
    const ids = tool.files.value.map((entry: { id: number }) => entry.id)
    expect(new Set(ids).size).toBe(2)
    tool.moveFile(1, -1)
    expect(tool.files.value.map((entry: { id: number }) => entry.id)).toEqual([...ids].reverse())
    tool.removeFile(0)
    expect(tool.files.value).toHaveLength(1)
    expect(tool.files.value[0].id).toBe(ids[0])
  })
  it('does not publish a merge after Clear', async () => {
    const read = deferred<ArrayBuffer>()
    const { tool, bindings } = loadTool('pages/pdf/merge.vue', 'addFiles,clearFiles,handleMerge,resultUrl', { PDFDocument: pdfDocument() })
    tool.addFiles([{ arrayBuffer: () => read.promise }, { arrayBuffer: async () => new ArrayBuffer(0) }])
    const processing = tool.handleMerge()
    await Promise.resolve()
    tool.clearFiles()
    read.resolve(new ArrayBuffer(0))
    await processing
    expect(tool.resultUrl.value).toBe('')
    expect(bindings.URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('does not publish a split after source removal', async () => {
    const read = deferred<ArrayBuffer>()
    const { tool } = loadTool('pages/pdf/split.vue', 'handleFiles,clearFile,handleSplit,pageRange,results', { PDFDocument: pdfDocument() })
    tool.handleFiles([{ arrayBuffer: () => read.promise }])
    tool.pageRange.value = '1'
    const processing = tool.handleSplit()
    tool.clearFile()
    read.resolve(new ArrayBuffer(0))
    await processing
    expect(tool.results.value).toEqual([])
  })

  it('still publishes an unchanged valid merge', async () => {
    const { tool, cleanup } = loadTool('pages/pdf/merge.vue', 'addFiles,handleMerge,resultUrl', { PDFDocument: pdfDocument() })
    tool.addFiles(Array.from({ length: 2 }, () => ({ arrayBuffer: async () => new ArrayBuffer(0) })))
    await tool.handleMerge()
    expect(tool.resultUrl.value).toBe('blob:result')
    cleanup()
  })
})

describe('Shared file input validation', () => {
  const loadInput = (props: Record<string, unknown> = {}) => {
    const emit = vi.fn()
    const { tool } = loadTool('ui/components/AppFileDropZone.vue', 'processFiles,sizeError', {
      defineProps: () => ({ label: 'Files', hint: 'Choose files', accept: 'application/pdf,.pdf', ...props }),
      withDefaults: (values: object, defaults: object) => ({ ...defaults, ...values }),
      defineEmits: () => emit,
      useId: () => 'files', onMounted: () => {}, getFileSizeError
    })
    return { tool, emit }
  }

  it('rejects mixed-type batches without publishing accepted files', () => {
    const { tool, emit } = loadInput({ multiple: true })
    const invalid = { name: 'image.png', type: 'image/png', size: 1 }
    tool.processFiles([{ name: 'document.pdf', type: 'application/pdf', size: 1 }, invalid])
    expect(emit.mock.calls).toEqual([['filesRejected', [invalid]]])
  })

  it('accepts exactly 100 MB and rejects an extra byte', () => {
    expect(getFileSizeError([{ size: maxFileBytes }])).toBe('')
    expect(getFileSizeError([{ size: maxFileBytes + 1 }])).not.toBe('')
  })

  it('includes previously added files in the total size limit', () => {
    const { tool, emit } = loadInput({ multiple: true, currentTotalBytes: 60_000_000 })
    tool.processFiles([{ name: 'large.pdf', type: 'application/pdf', size: 40_000_001 }])
    expect(emit).not.toHaveBeenCalled()
    expect(tool.sizeError.value).not.toBe('')
  })

  it('allows replacing a single file without accumulating its previous size', () => {
    const { tool, emit } = loadInput({ currentTotalBytes: 90_000_000 })
    const file = { name: 'replacement.pdf', type: 'application/pdf', size: 90_000_000 }
    tool.processFiles([file])
    expect(emit.mock.calls).toEqual([['filesSelected', [file]]])
  })
})

describe('QR operation failures', () => {
  it('contains a rejected camera restart initiated by the scanner', async () => {
    let starts = 0
    class Scanner {
      async start() {
        if (++starts > 1) throw 'Camera not found.'
      }
      destroy() {}
    }
    const { tool } = loadTool('pages/qr/scanner.vue', 'startCamera,cameraVideo,cameraScanner,isCameraActive,statusType', {
      QrScanner: Scanner, navigator: {}, createWorker: () => ({ terminate() {} })
    })
    tool.cameraVideo.value = {}
    await tool.startCamera()
    const scanner = tool.cameraScanner.value
    await expect(scanner.start()).resolves.toBeUndefined()
    expect(tool.isCameraActive.value).toBe(false)
    expect(tool.statusType.value).toBe('error')
  })

  it('stops the camera when its video track ends', async () => {
    const track = Object.assign(new EventTarget(), { readyState: 'live', stop: vi.fn() })
    class Scanner {
      async start() {}
      destroy() {}
    }
    const { tool } = loadTool('pages/qr/scanner.vue', 'startCamera,cameraVideo,isCameraActive,statusType', {
      QrScanner: Scanner, navigator: {}, createWorker: () => ({ terminate() {} })
    })
    tool.cameraVideo.value = { srcObject: { getVideoTracks: () => [track], getTracks: () => [track] } }
    await tool.startCamera()
    track.dispatchEvent(new Event('ended'))
    expect(tool.isCameraActive.value).toBe(false)
    expect(tool.statusType.value).toBe('error')
    expect(track.stop).toHaveBeenCalled()
  })

  it('handles revoked camera permission and removes its listener', async () => {
    const permission = Object.assign(new EventTarget(), { state: 'granted' })
    class Scanner {
      async start() {}
      destroy() {}
    }
    const { tool } = loadTool('pages/qr/scanner.vue', 'startCamera,cameraVideo,isCameraActive,statusType,clearResult', {
      QrScanner: Scanner,
      navigator: { permissions: { query: async () => permission } },
      createWorker: () => ({ terminate() {} })
    })
    tool.cameraVideo.value = {}
    await tool.startCamera()
    permission.state = 'denied'
    permission.dispatchEvent(new Event('change'))
    expect(tool.isCameraActive.value).toBe(false)
    expect(tool.statusType.value).toBe('error')
    tool.clearResult()
    permission.dispatchEvent(new Event('change'))
    expect(tool.statusType.value).toBe('')
  })
  it('handles blocked worker creation', async () => {
    const { tool } = loadTool('pages/qr/scanner.vue', 'handleImages,statusType', {
      QrScanner: {}, createWorker: () => { throw new Error('Blocked') }
    })
    await expect(tool.handleImages([{ name: 'qr.png' }])).resolves.toBeUndefined()
    expect(tool.statusType.value).toBe('error')
  })

  it('does not let an earlier image overwrite the latest result', async () => {
    const first = deferred<{ data: string }>()
    const second = deferred<{ data: string }>()
    const terminate = vi.fn()
    const { tool } = loadTool('pages/qr/scanner.vue', 'handleImages,scanResult,selectedFileName', {
      QrScanner: { scanImage: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) },
      createWorker: () => ({ terminate })
    })
    const a = tool.handleImages([{ name: 'A.png' }])
    const b = tool.handleImages([{ name: 'B.png' }])
    second.resolve({ data: 'B' })
    await b
    first.resolve({ data: 'A' })
    await a
    expect(tool.scanResult.value).toBe('B')
    expect(tool.selectedFileName.value).toBe('B.png')
    expect(terminate).toHaveBeenCalled()
  })

  it('ignores late camera startup after Clear even if destruction fails', async () => {
    const permission = deferred<void>()
    class Scanner {
      start() { return permission.promise }
      destroy() { throw new Error('Cleanup failed') }
    }
    const { tool } = loadTool('pages/qr/scanner.vue', 'startCamera,clearResult,cameraVideo,statusMessage,isStartingCamera', {
      QrScanner: Scanner, createWorker: () => ({ terminate() {} })
    })
    tool.cameraVideo.value = {}
    const processing = tool.startCamera()
    await Promise.resolve()
    tool.clearResult()
    permission.resolve()
    await processing
    expect(tool.statusMessage.value).toBe('')
    expect(tool.isStartingCamera.value).toBe(false)
  })

  it('does not restore a QR preview after Reset', async () => {
    const generated = deferred<string>()
    const { tool } = loadTool('pages/qr/generator.vue', 'qrText,qrDataUrl,handleGenerate,handleReset', {
      QRCode: { toDataURL: () => generated.promise }
    })
    tool.qrText.value = 'example'
    const processing = tool.handleGenerate()
    tool.handleReset()
    generated.resolve('data:image/png;base64,example')
    await processing
    expect(tool.qrDataUrl.value).toBe('')
  })
})

describe('Organizer preview resources', () => {
  it('leaves loading even when preview and worker cleanup fail', async () => {
    const { tool } = loadTool('pages/pdf/organize.vue', 'handleFiles,isLoading,hasError', {
      PDFDocument: pdfDocument(), pdfWorkerUrl: '/worker.mjs',
      pdfjsMock: {
        GlobalWorkerOptions: {},
        getDocument: () => ({
          promise: Promise.reject(new Error('Preview failed')),
          destroy: async () => { throw new Error('Cleanup failed') }
        })
      }
    })
    await expect(tool.handleFiles([{ arrayBuffer: async () => new ArrayBuffer(0) }])).resolves.toBeUndefined()
    expect(tool.isLoading.value).toBe(false)
    expect(tool.hasError.value).toBe(true)
  })

  it('renders only 12 initial previews and releases the worker on Clear', async () => {
    const render = vi.fn(async () => {})
    const destroy = vi.fn(async () => {})
    const document = {
      numPages: 30,
      getPage: async () => ({
        getViewport: () => ({ width: 240, height: 320 }),
        render: () => ({ promise: render() }),
        cleanup() {}
      })
    }
    const { tool } = loadTool('pages/pdf/organize.vue', 'handleFiles,clearFile,pages,visiblePages,loadMorePages,selectedPages,removePages', {
      PDFDocument: pdfDocument(), pdfWorkerUrl: '/worker.mjs',
      window: { document: { createElement: () => ({ toDataURL: () => 'data:image/png;base64,test' }) } },
      pdfjsMock: { GlobalWorkerOptions: {}, getDocument: () => ({ promise: Promise.resolve(document), destroy }) }
    })
    await tool.handleFiles([{ arrayBuffer: async () => new ArrayBuffer(0) }])
    expect(tool.pages.value).toHaveLength(30)
    expect(tool.visiblePages.value).toHaveLength(12)
    expect(render).toHaveBeenCalledTimes(12)
    await tool.loadMorePages()
    expect(tool.visiblePages.value).toHaveLength(24)
    expect(render).toHaveBeenCalledTimes(24)
    tool.selectedPages.value = tool.pages.value.slice(0, 24).map((page: { index: number }) => page.index)
    await tool.removePages()
    expect(tool.visiblePages.value).toHaveLength(6)
    expect(tool.visiblePages.value.every((page: { preview: string }) => Boolean(page.preview))).toBe(true)
    expect(render).toHaveBeenCalledTimes(30)
    tool.clearFile()
    await Promise.resolve()
    expect(destroy).toHaveBeenCalledTimes(1)
  })
})
