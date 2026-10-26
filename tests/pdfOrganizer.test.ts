import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { PDFDocument, degrees } from 'pdf-lib'
import Organizer from '../pages/pdf/organize.vue'
import { button, captureDownloads, chooseFiles, deferred, makePdf, mountTool, pointer } from './helpers'

const preview = vi.hoisted(() => ({ getDocument: vi.fn(), render: vi.fn(), destroy: vi.fn() }))
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: preview.getDocument }))

let output: ReturnType<typeof captureDownloads>
beforeEach(() => {
  output = captureDownloads()
  preview.render.mockReset().mockResolvedValue(undefined)
  preview.destroy.mockReset().mockResolvedValue(undefined)
  preview.getDocument.mockReset().mockImplementation(({ data }: { data: Uint8Array }) => ({
    destroy: preview.destroy,
    promise: PDFDocument.load(data).then(pdf => ({
      numPages: pdf.getPageCount(),
      getPage: async (number: number) => ({
        getViewport: () => ({ width: pdf.getPage(number - 1).getWidth(), height: 500 }),
        render: () => ({ promise: preview.render() }),
        cleanup() {}
      })
    }))
  }))
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,test')
})
afterEach(() => { vi.restoreAllMocks() })

const ready = async (wrapper: ReturnType<typeof mountTool>) => {
  await vi.waitFor(() => expect(button(wrapper, 'Download organized PDF').attributes('disabled')).toBeUndefined())
}

describe('PDF Organizer UI with real export and simulated previews', () => {
  it('starts disabled and loads previews in batches until the final partial batch', async () => {
    const wrapper = mountTool(Organizer)
    expect(button(wrapper, 'Download organized PDF').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [await makePdf('book.pdf', Array.from({ length: 30 }, (_, i) => 301 + i))])
    await ready(wrapper)
    expect(wrapper.findAll('li img')).toHaveLength(12)
    await button(wrapper, 'Load more pages').trigger('click')
    await ready(wrapper)
    expect(wrapper.findAll('li img')).toHaveLength(24)
    await button(wrapper, 'Load more pages').trigger('click')
    await ready(wrapper)
    expect(wrapper.findAll('li img')).toHaveLength(30)
    expect(wrapper.findAll('button').some(item => item.text() === 'Load more pages')).toBe(false)
    expect(preview.render).toHaveBeenCalledTimes(30)
  })

  it('selects/unselects all and prevents removing every page', async () => {
    const wrapper = mountTool(Organizer)
    await chooseFiles(wrapper, [await makePdf()])
    await ready(wrapper)
    expect(button(wrapper, 'Rotate right').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Select all').trigger('click')
    expect(wrapper.findAll('input[type="checkbox"]').every(item => (item.element as HTMLInputElement).checked)).toBe(true)
    expect(button(wrapper, 'Remove').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Unselect all').trigger('click')
    expect(wrapper.findAll('input[type="checkbox"]').some(item => (item.element as HTMLInputElement).checked)).toBe(false)
  })

  it('exports combined removal, rotation, and keyboard reordering accurately', async () => {
    const wrapper = mountTool(Organizer)
    await chooseFiles(wrapper, [await makePdf('thesis.pdf')])
    await ready(wrapper)
    await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true)
    await wrapper.findAll('input[type="checkbox"]')[3]!.setValue(true)
    await button(wrapper, 'Remove').trigger('click')
    await ready(wrapper)
    expect(wrapper.findAll('li')).toHaveLength(3)
    await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true)
    await button(wrapper, 'Rotate right').trigger('click')
    expect(wrapper.findAll('li img')[1]!.attributes('style')).toContain('rotate(90deg)')
    await wrapper.findAll('button[aria-label^="Reorder"]')[2]!.trigger('keydown', { key: 'ArrowUp' })
    await wrapper.findAll('button[aria-label^="Reorder"]')[1]!.trigger('keydown', { key: 'ArrowUp' })
    await button(wrapper, 'Download organized PDF').trigger('click')
    await vi.waitFor(() => expect(output.downloads).toHaveLength(1))
    const pdf = await output.pdf()
    expect(pdf.getPages().map(page => page.getWidth())).toEqual([305, 301, 303])
    expect(pdf.getPages().map(page => page.getRotation().angle)).toEqual([0, 0, 90])
    expect(output.downloads[0]!.name).toBe('thesis-organized.pdf')
  })

  it('preserves original rotation while applying left rotation', async () => {
    const source = await PDFDocument.create()
    source.addPage([301, 500]).setRotation(degrees(90))
    const bytes = await source.save()
    const file = new File([new Uint8Array(bytes)], 'rotated.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'arrayBuffer', { value: async () => Uint8Array.from(bytes).buffer })
    const wrapper = mountTool(Organizer)
    await chooseFiles(wrapper, [file])
    await ready(wrapper)
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await button(wrapper, 'Rotate left').trigger('click')
    await button(wrapper, 'Download organized PDF').trigger('click')
    await vi.waitFor(() => expect(output.downloads).toHaveLength(1))
    expect((await output.pdf()).getPage(0).getRotation().angle).toBe(0)
  })

  it('fills newly visible previews after removing the initial batch', async () => {
    const wrapper = mountTool(Organizer)
    await chooseFiles(wrapper, [await makePdf('book.pdf', Array.from({ length: 15 }, (_, i) => 301 + i))])
    await ready(wrapper)
    for (const check of wrapper.findAll('input[type="checkbox"]')) await check.setValue(true)
    await button(wrapper, 'Remove').trigger('click')
    await ready(wrapper)
    expect(wrapper.findAll('li img')).toHaveLength(3)
    expect(preview.render).toHaveBeenCalledTimes(15)
  })

  it('supports pointer reordering on the stable list', async () => {
    const wrapper = mountTool(Organizer)
    await chooseFiles(wrapper, [await makePdf()])
    await ready(wrapper)
    const list = wrapper.get('ol')
    Object.defineProperty(list.element, 'setPointerCapture', { value: vi.fn() })
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => wrapper.findAll('li')[0]!.element) })
    await pointer(wrapper.findAll('button[aria-label^="Reorder"]')[4]!.element, 'pointerdown', { button: 0, isPrimary: true, pointerId: 1 })
    await pointer(list.element, 'pointermove', { clientX: 10, clientY: 10 })
    await list.trigger('pointerup')
    expect(wrapper.findAll('li')[0]!.text()).toContain('Page 5')
  })

  it('handles render failure, cleanup failure, and recovery with a replacement source', async () => {
    const wrapper = mountTool(Organizer)
    preview.render.mockRejectedValueOnce(new Error('Render failed'))
    preview.destroy.mockRejectedValueOnce(new Error('Cleanup failed'))
    await chooseFiles(wrapper, [await makePdf()])
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(button(wrapper, 'Download organized PDF').attributes('disabled')).toBeDefined()
    await chooseFiles(wrapper, [await makePdf('replacement.pdf')])
    await ready(wrapper)
    expect(wrapper.findAll('li')).toHaveLength(5)
  })

  it('allows retrying a failed additional preview batch', async () => {
    const wrapper = mountTool(Organizer)
    await chooseFiles(wrapper, [await makePdf('book.pdf', Array.from({ length: 15 }, (_, i) => 301 + i))])
    await ready(wrapper)
    preview.render.mockRejectedValueOnce(new Error('Render failed'))
    await button(wrapper, 'Load more pages').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.findAll('li')).toHaveLength(12)
    await button(wrapper, 'Load more pages').trigger('click')
    await ready(wrapper)
    expect(wrapper.findAll('li img')).toHaveLength(15)
  })

  it('clears output, selection, and workers without remounting', async () => {
    const wrapper = mountTool(Organizer)
    await chooseFiles(wrapper, [await makePdf()])
    await ready(wrapper)
    await button(wrapper, 'Download organized PDF').trigger('click')
    await vi.waitFor(() => expect(output.create).toHaveBeenCalled())
    await button(wrapper, 'Clear').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(button(wrapper, 'Download organized PDF').attributes('disabled')).toBeDefined()
    expect(output.revoke).toHaveBeenCalledWith('blob:test-0')
    expect(preview.destroy).toHaveBeenCalled()
    await chooseFiles(wrapper, [await makePdf('new.pdf')])
    await ready(wrapper)
  })

  it('does not publish a document whose pending preview was cleared', async () => {
    const pending = deferred<void>()
    preview.render.mockReturnValueOnce(pending.promise)
    const wrapper = mountTool(Organizer)
    await chooseFiles(wrapper, [await makePdf()])
    await vi.waitFor(() => expect(preview.render).toHaveBeenCalled())
    await button(wrapper, 'Clear').trigger('click')
    pending.resolve()
    await flushPromises()
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(button(wrapper, 'Download organized PDF').attributes('disabled')).toBeDefined()
  })
})
