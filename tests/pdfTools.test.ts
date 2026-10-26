import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { EncryptedPDFError, PDFDocument } from 'pdf-lib'
import Merge from '../pages/pdf/merge.vue'
import Split from '../pages/pdf/split.vue'
import { button, captureDownloads, chooseFiles, deferred, makePdf, mountTool, pointer } from './helpers'

let output: ReturnType<typeof captureDownloads>
beforeEach(() => { output = captureDownloads() })
afterEach(() => { vi.restoreAllMocks() })

describe('PDF Splitter UI and real output', () => {
  it('starts disabled and extracts the requested pages in order', async () => {
    const wrapper = mountTool(Split)
    expect(button(wrapper, 'Split PDF').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [await makePdf('thesis.pdf')])
    await wrapper.get('input[name="pageRange"]').setValue('1-3, 5')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
    await button(wrapper, 'Download').trigger('click')
    expect(output.downloads[0]!.name).toBe('thesis-split.pdf')
    expect((await output.pdf()).getPages().map(page => page.getWidth())).toEqual([301, 302, 303, 305])
  })

  it('preserves explicitly requested order and deduplicates overlapping ranges', async () => {
    const wrapper = mountTool(Split)
    await chooseFiles(wrapper, [await makePdf()])
    await wrapper.get('input[name="pageRange"]').setValue('3, 1-2, 2')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
    await button(wrapper, 'Download').trigger('click')
    expect((await output.pdf()).getPages().map(page => page.getWidth())).toEqual([303, 301, 302])
  })

  it.each(['0', '6', '4-2', 'abc', '1,', '1.5', '-1', '1-6'])('rejects invalid range %s and disables Download', async range => {
    const wrapper = mountTool(Split)
    await chooseFiles(wrapper, [await makePdf()])
    await wrapper.get('input[name="pageRange"]').setValue(range)
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    expect(output.create).not.toHaveBeenCalled()
  })

  it('splits every page into a correctly named one-page PDF', async () => {
    const wrapper = mountTool(Split)
    await chooseFiles(wrapper, [await makePdf('book.pdf', [301, 302, 303])])
    await wrapper.get('input[value="everyPage"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download 3 files').attributes('disabled')).toBeUndefined())
    await button(wrapper, 'Download 3 files').trigger('click')
    expect(output.downloads.map(item => item.name)).toEqual(['book-page-1.pdf', 'book-page-2.pdf', 'book-page-3.pdf'])
    for (let index = 0; index < 3; index += 1) {
      const pdf = await output.pdf(index)
      expect(pdf.getPageCount()).toBe(1)
      expect(pdf.getPage(0).getWidth()).toBe(301 + index)
    }
  })

  it('invalidates downloads for range, method, source changes and Clear', async () => {
    const wrapper = mountTool(Split)
    await chooseFiles(wrapper, [await makePdf()])
    await wrapper.get('input[name="pageRange"]').setValue('1-2')
    const generate = async () => {
      await wrapper.get('form').trigger('submit')
      await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
    }
    await generate()
    await wrapper.get('input[name="pageRange"]').setValue('3')
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    expect(output.revoke).toHaveBeenCalled()
    await generate()
    await wrapper.get('input[value="everyPage"]').setValue(true)
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [await makePdf('replacement.pdf')])
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Clear').trigger('click')
    expect(wrapper.find('button[aria-label="Remove selected PDF"]').exists()).toBe(false)
    expect((wrapper.get('input[value="range"]').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.get('input[name="pageRange"]').element as HTMLInputElement).value).toBe('')
    expect(button(wrapper, 'Split PDF').attributes('disabled')).toBeDefined()
  })

  it('handles encryption and recovers without remounting', async () => {
    const file = await makePdf()
    const wrapper = mountTool(Split)
    await chooseFiles(wrapper, [file])
    await wrapper.get('input[name="pageRange"]').setValue('1')
    vi.spyOn(PDFDocument, 'load').mockRejectedValueOnce(new EncryptedPDFError())
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('encrypted')
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
  })

  it('rejects malformed PDF bytes through the real parser and recovers with a valid file', async () => {
    const invalid = new File(['not a PDF'], 'invalid.pdf', { type: 'application/pdf' })
    Object.defineProperty(invalid, 'arrayBuffer', { value: async () => new TextEncoder().encode('not a PDF').buffer })
    const wrapper = mountTool(Split)
    await chooseFiles(wrapper, [invalid])
    await wrapper.get('input[name="pageRange"]').setValue('1')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [await makePdf()])
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
  })

  it('cleans partial results if a later per-page export fails', async () => {
    const file = await makePdf('source.pdf', [301, 302, 303])
    const save = PDFDocument.prototype.save
    let saves = 0
    vi.spyOn(PDFDocument.prototype, 'save').mockImplementation(function (this: PDFDocument, options) {
      if (++saves === 2) return Promise.reject(new Error('Export failed'))
      return save.call(this, options)
    })
    const wrapper = mountTool(Split)
    await chooseFiles(wrapper, [file])
    await wrapper.get('input[value="everyPage"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(output.create).toHaveBeenCalledTimes(1)
    expect(output.revoke).toHaveBeenCalledWith('blob:test-0')
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
  })

  it('prevents stale results when a pending read is cleared or unmounted', async () => {
    for (const unmount of [false, true]) {
      const read = deferred<ArrayBuffer>()
      const file = await makePdf()
      const bytes = await file.arrayBuffer()
      const pendingFile = new File([], 'pending.pdf', { type: 'application/pdf' })
      Object.defineProperty(pendingFile, 'arrayBuffer', { value: () => read.promise })
      const wrapper = mountTool(Split)
      await chooseFiles(wrapper, [pendingFile])
      await wrapper.get('input[name="pageRange"]').setValue('1')
      await wrapper.get('form').trigger('submit')
      if (unmount) wrapper.unmount()
      else await button(wrapper, 'Clear').trigger('click')
      read.resolve(bytes)
      await flushPromises()
      expect(output.create).not.toHaveBeenCalled()
    }
  })
})

describe('PDF Merger UI and real output', () => {
  it('requires two files and merges source pages in list order', async () => {
    const wrapper = mountTool(Merge)
    expect(button(wrapper, 'Merge PDF').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [await makePdf('first.pdf', [301, 302])])
    expect(button(wrapper, 'Merge PDF').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [await makePdf('second.pdf', [401])])
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
    await button(wrapper, 'Download').trigger('click')
    expect(output.downloads[0]!.name).toBe('first-merged.pdf')
    expect((await output.pdf()).getPages().map(page => page.getWidth())).toEqual([301, 302, 401])
  })

  it('keeps duplicate selections independently removable and doubles the page count', async () => {
    const wrapper = mountTool(Merge)
    const file = await makePdf('same.pdf', [301, 302])
    await chooseFiles(wrapper, [file, file])
    expect(wrapper.findAll('li')).toHaveLength(2)
    await wrapper.findAll('button[aria-label^="Remove"]')[0]!.trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(1)
    await chooseFiles(wrapper, [file])
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
    await button(wrapper, 'Download').trigger('click')
    expect((await output.pdf()).getPageCount()).toBe(4)
  })

  it('supports keyboard reordering, invalidates results, and clears state', async () => {
    const wrapper = mountTool(Merge)
    await chooseFiles(wrapper, [await makePdf('a.pdf', [301]), await makePdf('b.pdf', [401])])
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
    await wrapper.findAll('button[aria-label^="Reorder"]')[1]!.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.findAll('li')[0]!.text()).toContain('b.pdf')
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
    await button(wrapper, 'Download').trigger('click')
    expect((await output.pdf()).getPages().map(page => page.getWidth())).toEqual([401, 301])
    await wrapper.get('button[aria-label="Remove a.pdf"]').trigger('click')
    expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Clear').trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(button(wrapper, 'Merge PDF').attributes('disabled')).toBeDefined()
  })

  it('handles pointer reordering in both directions without recapturing the moved handle', async () => {
    const wrapper = mountTool(Merge)
    await chooseFiles(wrapper, [await makePdf('a.pdf'), await makePdf('b.pdf'), await makePdf('c.pdf')])
    const list = wrapper.get('ol')
    const capture = vi.fn()
    Object.defineProperty(list.element, 'setPointerCapture', { value: capture })
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => wrapper.findAll('li')[0]!.element) })
    await pointer(wrapper.findAll('button[aria-label^="Reorder"]')[2]!.element, 'pointerdown', { isPrimary: true, button: 0, pointerId: 1 })
    await pointer(list.element, 'pointermove', { clientX: 10, clientY: 10 })
    expect(wrapper.findAll('li')[0]!.text()).toContain('c.pdf')
    vi.mocked(document.elementFromPoint).mockReturnValue(wrapper.findAll('li')[2]!.element)
    await pointer(list.element, 'pointermove', { clientX: 10, clientY: 90 })
    expect(wrapper.findAll('li')[2]!.text()).toContain('c.pdf')
    await list.trigger('pointerup')
    expect(capture).toHaveBeenCalledTimes(1)
  })

  it('rejects mixed types atomically and accepts a subsequent valid batch', async () => {
    const wrapper = mountTool(Merge)
    const pdf = await makePdf()
    await chooseFiles(wrapper, [pdf, new File([], 'image.png', { type: 'image/png' })])
    expect(wrapper.get('[role="alert"]').text()).toContain('Only PDF')
    expect(wrapper.findAll('li')).toHaveLength(0)
    await chooseFiles(wrapper, [pdf, pdf])
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('rejects encrypted or damaged inputs and recovers', async () => {
    const wrapper = mountTool(Merge)
    await chooseFiles(wrapper, [await makePdf(), await makePdf('other.pdf')])
    for (const error of [new EncryptedPDFError(), new Error('Invalid PDF')]) {
      vi.spyOn(PDFDocument, 'load').mockRejectedValueOnce(error)
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(wrapper.get('[role="alert"]').text()).toContain(error instanceof Error && error.message.includes('encrypted') ? 'encrypted' : 'Unable to merge')
      expect(button(wrapper, 'Download').attributes('disabled')).toBeDefined()
    }
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Download').attributes('disabled')).toBeUndefined())
  })

  it('releases an existing result URL on unmount', async () => {
    const wrapper = mountTool(Merge)
    const file = await makePdf()
    await chooseFiles(wrapper, [file, file])
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(output.create).toHaveBeenCalled())
    wrapper.unmount()
    expect(output.revoke).toHaveBeenCalledWith('blob:test-0')
  })
})
