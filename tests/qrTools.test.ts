import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import Generator from '../pages/qr/generator.vue'
import Scanner from '../pages/qr/scanner.vue'
import { button, captureDownloads, chooseFiles, deferred, mountTool, pasteFiles } from './helpers'

const qr = vi.hoisted(() => ({
  generate: vi.fn(), scan: vi.fn(), start: vi.fn(), destroy: vi.fn(), terminate: vi.fn(), worker: vi.fn(),
  instances: [] as { decode: (result: { data: string }) => void; start: () => Promise<void> }[]
}))
vi.mock('qrcode', () => ({ default: { toDataURL: qr.generate } }))
vi.mock('qr-scanner/qr-scanner-worker.min.js', () => ({ createWorker: qr.worker }))
vi.mock('qr-scanner', () => ({
  default: class {
    static scanImage = qr.scan
    static createQrEngine = async () => ({})
    decode: (result: { data: string }) => void
    constructor(_video: HTMLVideoElement, decode: (result: { data: string }) => void) {
      this.decode = decode
      qr.instances.push(this)
    }
    start() { return qr.start() }
    destroy() { qr.destroy() }
  }
}))

let output: ReturnType<typeof captureDownloads>
beforeEach(() => {
  output = captureDownloads()
  qr.generate.mockReset().mockResolvedValue('data:image/png;base64,test')
  qr.scan.mockReset().mockResolvedValue({ data: 'MariKit test' })
  qr.start.mockReset().mockResolvedValue(undefined)
  qr.destroy.mockReset()
  qr.terminate.mockReset()
  qr.worker.mockReset().mockImplementation(() => ({ terminate: qr.terminate }))
  qr.instances.length = 0
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } })
})
afterEach(() => { vi.restoreAllMocks() })

describe('QR Generator component', () => {
  it('generates from the current input and downloads a timestamped PNG', async () => {
    const wrapper = mountTool(Generator)
    expect(button(wrapper, 'Generate QR Code').attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Download PNG').attributes('disabled')).toBeDefined()
    await wrapper.get('input').setValue(' MariKit test ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(qr.generate).toHaveBeenCalledWith('MariKit test', expect.objectContaining({ width: 512, errorCorrectionLevel: 'M' }))
    expect(wrapper.get('img').attributes('src')).toBe('data:image/png;base64,test')
    await button(wrapper, 'Download PNG').trigger('click')
    expect(output.downloads[0]!.name).toMatch(/^marikit-qr-\d{8}-\d{6}\.png$/)
    expect(output.downloads[0]!.url).toBe('data:image/png;base64,test')
  })

  it('invalidates after editing and resets all input/output', async () => {
    const wrapper = mountTool(Generator)
    await wrapper.get('input').setValue('old')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await wrapper.get('input').setValue('updated')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(button(wrapper, 'Download PNG').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(qr.generate.mock.calls[1]![0]).toBe('updated')
    await button(wrapper, 'Reset').trigger('click')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(button(wrapper, 'Generate QR Code').attributes('disabled')).toBeDefined()
  })

  it('does not generate whitespace and exposes the input length limit', async () => {
    const wrapper = mountTool(Generator)
    expect(wrapper.get('input').attributes('maxlength')).toBe('2048')
    await wrapper.get('input').setValue('  ')
    await wrapper.get('form').trigger('submit')
    expect(qr.generate).not.toHaveBeenCalled()
  })

  it('handles generation failure and recovers on retry', async () => {
    const wrapper = mountTool(Generator)
    qr.generate.mockRejectedValueOnce(new Error('Too much data'))
    await wrapper.get('input').setValue('text')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to generate')
    expect(button(wrapper, 'Download PNG').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('does not restore an in-flight result after Reset or unmount', async () => {
    for (const unmount of [false, true]) {
      const pending = deferred<string>()
      qr.generate.mockReturnValueOnce(pending.promise)
      const wrapper = mountTool(Generator)
      await wrapper.get('input').setValue('text')
      await wrapper.get('form').trigger('submit')
      expect(button(wrapper, 'Generate QR Code').attributes('disabled')).toBeDefined()
      if (unmount) wrapper.unmount()
      else await button(wrapper, 'Reset').trigger('click')
      pending.resolve('data:image/png;base64,late')
      await flushPromises()
      if (!unmount) expect(wrapper.find('img').exists()).toBe(false)
    }
    expect(output.downloads).toHaveLength(0)
  })
})

describe('QR Scanner component', () => {
  const image = () => new File(['image'], 'qr.png', { type: 'image/png' })

  it('scans an image, copies the exact result, and releases its worker', async () => {
    const wrapper = mountTool(Scanner)
    expect(button(wrapper, 'Copy').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [image()])
    expect(wrapper.text()).toContain('MariKit test')
    expect(qr.scan).toHaveBeenCalledWith(expect.any(File), expect.objectContaining({ returnDetailedScanResult: true }))
    expect(qr.terminate).toHaveBeenCalled()
    await button(wrapper, 'Copy').trigger('click')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MariKit test')
  })

  it.each([
    ['https://example.com', true], ['http://example.com', true], ['MariKit test', false],
    ['javascript:alert(1)', false], ['data:text/html,test', false], ['file:///private', false]
  ])('allows Open link for %s only when it is HTTP(S)', async (content, allowed) => {
    qr.scan.mockResolvedValueOnce({ data: content })
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const wrapper = mountTool(Scanner)
    await chooseFiles(wrapper, [image()])
    expect(button(wrapper, 'Open link').attributes('disabled') === undefined).toBe(allowed)
    await button(wrapper, 'Open link').trigger('click')
    if (allowed) expect(open).toHaveBeenCalledWith(content, '_blank', 'noopener,noreferrer')
    else expect(open).not.toHaveBeenCalled()
  })

  it('clears old results for an unreadable image and recovers on another image', async () => {
    const wrapper = mountTool(Scanner)
    await chooseFiles(wrapper, [image()])
    qr.scan.mockRejectedValueOnce(new Error('No QR'))
    await chooseFiles(wrapper, [image()])
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(button(wrapper, 'Copy').attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Open link').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [image()])
    expect(button(wrapper, 'Copy').attributes('disabled')).toBeUndefined()
  })

  it('handles worker creation failure without leaving Scanning image', async () => {
    qr.worker.mockImplementationOnce(() => { throw new Error('Blocked') })
    const wrapper = mountTool(Scanner)
    await chooseFiles(wrapper, [image()])
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to start')
  })

  it('handles copy failure while preserving the decoded content', async () => {
    const wrapper = mountTool(Scanner)
    await chooseFiles(wrapper, [image()])
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Denied'))
    await button(wrapper, 'Copy').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to copy')
    expect(wrapper.text()).toContain('MariKit test')
  })

  it('supports repeated pasted screenshots and clears results on removal', async () => {
    const wrapper = mountTool(Scanner)
    pasteFiles(document, [image()])
    await flushPromises()
    qr.scan.mockResolvedValueOnce({ data: 'second QR' })
    pasteFiles(document, [image()], true)
    await flushPromises()
    expect(wrapper.text()).toContain('second QR')
    await wrapper.get('button[aria-label="Remove selected image"]').trigger('click')
    expect(button(wrapper, 'Copy').attributes('disabled')).toBeDefined()
  })

  it('ignores a previous image completing after the newer one', async () => {
    const first = deferred<{ data: string }>()
    qr.scan.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ data: 'latest' })
    const wrapper = mountTool(Scanner)
    await chooseFiles(wrapper, [image()])
    await chooseFiles(wrapper, [image()])
    first.resolve({ data: 'obsolete' })
    await flushPromises()
    expect(wrapper.text()).toContain('latest')
    expect(wrapper.text()).not.toContain('obsolete')
  })

  it('starts/stops the camera and stops automatically after a decoded QR', async () => {
    const wrapper = mountTool(Scanner)
    await button(wrapper, 'Use camera').trigger('click')
    await flushPromises()
    expect(wrapper.find('video').exists()).toBe(true)
    expect(qr.start).toHaveBeenCalledTimes(1)
    qr.instances[0]!.decode({ data: 'camera result' })
    await flushPromises()
    expect(wrapper.text()).toContain('camera result')
    expect(wrapper.find('video').exists()).toBe(false)
    expect(qr.destroy).toHaveBeenCalledTimes(1)
    await button(wrapper, 'Use camera').trigger('click')
    await flushPromises()
    await button(wrapper, 'Stop camera').trigger('click')
    expect(wrapper.find('video').exists()).toBe(false)
    wrapper.unmount()
    expect(qr.destroy).toHaveBeenCalledTimes(2)
  })

  it('keeps image input usable after camera denial', async () => {
    qr.start.mockRejectedValueOnce('Camera not found.')
    const wrapper = mountTool(Scanner)
    await button(wrapper, 'Use camera').trigger('click')
    await flushPromises()
    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.get('[role="alert"]').text()).toContain('denied')
    await chooseFiles(wrapper, [image()])
    expect(button(wrapper, 'Copy').attributes('disabled')).toBeUndefined()
  })

  it('destroys an active camera when unmounted', async () => {
    const wrapper = mountTool(Scanner)
    await button(wrapper, 'Use camera').trigger('click')
    await flushPromises()
    wrapper.unmount()
    expect(qr.destroy).toHaveBeenCalledTimes(1)
  })

  it('contains camera restart errors and allows a later explicit restart', async () => {
    const wrapper = mountTool(Scanner)
    await button(wrapper, 'Use camera').trigger('click')
    await flushPromises()
    qr.start.mockRejectedValueOnce('Camera not found.')
    await expect(qr.instances[0]!.start()).resolves.toBeUndefined()
    await flushPromises()
    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    await button(wrapper, 'Use camera').trigger('click')
    await flushPromises()
    expect(wrapper.find('video').exists()).toBe(true)
  })

  it('handles camera permission revocation through component listeners', async () => {
    const permission = Object.assign(new EventTarget(), { state: 'granted' })
    const previous = Object.getOwnPropertyDescriptor(navigator, 'permissions')
    Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query: async () => permission } })
    try {
      const wrapper = mountTool(Scanner)
      await button(wrapper, 'Use camera').trigger('click')
      await flushPromises()
      permission.state = 'denied'
      permission.dispatchEvent(new Event('change'))
      await flushPromises()
      expect(wrapper.find('video').exists()).toBe(false)
      expect(wrapper.get('[role="alert"]').text()).toContain('access was lost or denied')
      await chooseFiles(wrapper, [image()])
      expect(button(wrapper, 'Copy').attributes('disabled')).toBeUndefined()
      wrapper.unmount()
      permission.dispatchEvent(new Event('change'))
    } finally {
      if (previous) Object.defineProperty(navigator, 'permissions', previous)
      else Reflect.deleteProperty(navigator, 'permissions')
    }
  })
})
