import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AppButton from '../ui/components/AppButton.vue'
import AppInput from '../ui/components/AppInput.vue'
import DropZone from '../ui/components/AppFileDropZone.vue'
import { pasteFiles } from './helpers'

afterEach(() => { vi.restoreAllMocks() })

describe('Shared button and input', () => {
  it('defaults to a non-submit button, forwards clicks, and blocks disabled/loading clicks', async () => {
    const click = vi.fn()
    const wrapper = mount(AppButton, { props: { onClick: click }, slots: { default: 'Run' } })
    expect(wrapper.attributes('type')).toBe('button')
    await wrapper.trigger('click')
    expect(click).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ loading: true })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await wrapper.trigger('click')
    expect(click).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ loading: false, disabled: true, type: 'submit' })
    expect(wrapper.attributes('type')).toBe('submit')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('connects labels, emits values, forwards constraints, and shows errors over hints', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Length', modelValue: '', hint: 'A hint' }, attrs: { min: 8, max: 128, required: true } })
    expect(wrapper.get('label').attributes('for')).toBe(wrapper.get('input').attributes('id'))
    await wrapper.get('input').setValue('16')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['16'])
    expect(wrapper.get('input').attributes('min')).toBe('8')
    await wrapper.setProps({ error: 'Invalid length' })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('Invalid length')
    expect(wrapper.text()).not.toContain('A hint')
  })
})

describe('Shared file input DOM events', () => {
  const pdf = (size = 1) => {
    const file = new File(['x'], 'document.PDF', { type: '' })
    Object.defineProperty(file, 'size', { value: size })
    return file
  }
  const mountInput = (multiple = false, accept = 'application/pdf,.pdf') => mount(DropZone, {
    attachTo: document.body,
    props: { label: 'Files', hint: 'Choose files', accept, multiple }
  })

  it('accepts extension fallback, resets the picker, and allows selecting the same file repeatedly', async () => {
    const wrapper = mountInput()
    const input = wrapper.get('input')
    const file = pdf()
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')
    await input.trigger('change')
    expect(wrapper.emitted('filesSelected')).toEqual([[[file]], [[file]]])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('supports multiple/single selection consistently', async () => {
    const files = [pdf(), pdf()]
    const single = mountInput()
    pasteFiles(document, files)
    await flushPromises()
    expect(single.emitted('filesSelected')![0]).toEqual([[files[0]]])
    single.unmount()
    const multiple = mountInput(true)
    pasteFiles(document, files)
    await flushPromises()
    expect(multiple.emitted('filesSelected')![0]).toEqual([files])
  })

  it('validates drag/drop with the same type rules and resets drag feedback', async () => {
    const wrapper = mountInput()
    await wrapper.trigger('dragenter')
    expect(wrapper.text()).toContain('Drop files here')
    await wrapper.trigger('drop', { dataTransfer: { files: [pdf()] } })
    expect(wrapper.emitted('filesSelected')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Drop files here')
    await wrapper.trigger('drop', { dataTransfer: { files: [new File([], 'bad.png', { type: 'image/png' })] } })
    expect(wrapper.emitted('filesRejected')).toHaveLength(1)
  })

  it.each([100_000_000, 100_000_001])('enforces the file-size boundary at %i bytes without allocating a large file', async size => {
    const wrapper = mountInput()
    pasteFiles(document, [pdf(size)])
    await flushPromises()
    expect(Boolean(wrapper.emitted('filesSelected'))).toBe(size <= 100_000_000)
    expect(wrapper.find('[role="alert"]').exists()).toBe(size > 100_000_000)
  })

  it('rejects accumulated totals and clears the error after a valid retry', async () => {
    const wrapper = mountInput(true)
    await wrapper.setProps({ currentTotalBytes: 60_000_000 })
    pasteFiles(document, [pdf(40_000_001)])
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('combined')
    pasteFiles(document, [pdf(40_000_000)])
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('filesSelected')).toHaveLength(1)
  })

  it('accepts MIME wildcards and clipboard item fallback', async () => {
    const wrapper = mountInput(false, 'image/*')
    pasteFiles(document, [new File([], 'screenshot', { type: 'image/png' })], true)
    await flushPromises()
    expect(wrapper.emitted('filesSelected')).toHaveLength(1)
  })

  it('leaves text editing, empty clipboard, and already-handled events alone', async () => {
    const wrapper = mountInput()
    const textarea = document.createElement('textarea')
    document.body.append(textarea)
    const editing = pasteFiles(textarea, [pdf()])
    expect(editing.defaultPrevented).toBe(false)
    const empty = pasteFiles(document, [])
    expect(empty.defaultPrevented).toBe(false)
    const handled = new Event('paste', { cancelable: true })
    handled.preventDefault()
    document.dispatchEvent(handled)
    expect(wrapper.emitted('filesSelected')).toBeUndefined()
    textarea.remove()
  })

  it('ignores disabled inputs and removes its document listener on unmount', async () => {
    const wrapper = mountInput()
    ;(wrapper.get('input').element as HTMLInputElement).disabled = true
    pasteFiles(document, [pdf()])
    await wrapper.trigger('drop', { dataTransfer: { files: [pdf()] } })
    expect(wrapper.emitted('filesSelected')).toBeUndefined()
    ;(wrapper.get('input').element as HTMLInputElement).disabled = false
    wrapper.unmount()
    pasteFiles(document, [pdf()])
    expect(wrapper.emitted('filesSelected')).toBeUndefined()
  })
})
