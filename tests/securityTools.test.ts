import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createHash, webcrypto } from 'node:crypto'
import Password from '../pages/security/password.vue'
import Hash from '../pages/security/hash.vue'
import { generatePassword } from '../utils/security/passwordGenerator'
import { button, deferred, mountTool } from './helpers'

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } })
})

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Password generation', () => {
  it.each([8, 16, 128])('generates %i characters containing every enabled category', length => {
    const result = generatePassword(length)
    expect(result).toHaveLength(length)
    for (const pattern of [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/]) expect(result).toMatch(pattern)
  })

  it.each([
    ['lowercase', /^[a-z]+$/], ['uppercase', /^[A-Z]+$/],
    ['numbers', /^\d+$/], ['symbols', /^[^a-zA-Z0-9]+$/]
  ] as const)('limits output to %s when selected alone', (type, pattern) => {
    expect(generatePassword(32, [type])).toMatch(pattern)
  })

  it.each([0, 7, 129, 8.5, NaN, Infinity])('rejects invalid length %s', length => {
    expect(() => generatePassword(length)).toThrow()
  })

  it('rejects missing and unknown categories', () => {
    expect(() => generatePassword(16, [])).toThrow()
    expect(() => generatePassword(16, ['invalid'])).toThrow()
  })

  it.each(Array.from({ length: 15 }, (_, index) => index + 1))('supports character selection combination %i', mask => {
    const types = ['lowercase', 'uppercase', 'numbers', 'symbols']
    const patterns = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/]
    const selected = types.filter((_, index) => mask & (1 << index))
    const result = generatePassword(16, selected)
    patterns.forEach((pattern, index) => {
      if (selected.includes(types[index]!)) expect(result).toMatch(pattern)
      else expect(result).not.toMatch(pattern)
    })
  })

  it('generates, copies, invalidates on settings changes, and resets through the UI', async () => {
    const wrapper = mountTool(Password)
    expect(button(wrapper, 'Copy Password').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    const result = wrapper.get('.select-all').text()
    expect(result).toHaveLength(16)
    await button(wrapper, 'Copy Password').trigger('click')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(result)
    await wrapper.get('input[type="number"]').setValue('8')
    expect(button(wrapper, 'Copy Password').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('.select-all').text()).toHaveLength(8)
    await button(wrapper, 'Reset').trigger('click')
    expect((wrapper.get('input[type="number"]').element as HTMLInputElement).value).toBe('16')
    expect(wrapper.findAll('input[type="checkbox"]').every(input => (input.element as HTMLInputElement).checked)).toBe(true)
    expect(wrapper.find('.select-all').exists()).toBe(false)
  })

  it.each(['', '7', '129', '8.5'])('disables generation for invalid UI length %s', async value => {
    const wrapper = mountTool(Password)
    await wrapper.get('input[type="number"]').setValue(value)
    expect(button(wrapper, 'Generate Password').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('.select-all').exists()).toBe(false)
  })

  it('supports numbers alone and disables generation when nothing is selected', async () => {
    const wrapper = mountTool(Password)
    const checks = wrapper.findAll('input[type="checkbox"]')
    for (const index of [0, 1, 3]) await checks[index]!.setValue(false)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('.select-all').text()).toMatch(/^\d{16}$/)
    await checks[2]!.setValue(false)
    expect(button(wrapper, 'Generate Password').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Select at least one character type.')
  })

  it('handles unavailable randomness and allows retry', async () => {
    const wrapper = mountTool(Password)
    vi.stubGlobal('crypto', { getRandomValues() { throw new Error('Unavailable') } })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to generate')
    vi.stubGlobal('crypto', webcrypto)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('.select-all').text()).toHaveLength(16)
  })

  it('preserves a password after clipboard failure and supports retry', async () => {
    const wrapper = mountTool(Password)
    await wrapper.get('form').trigger('submit')
    const result = wrapper.get('.select-all').text()
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Denied'))
    await button(wrapper, 'Copy Password').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('copy it manually')
    expect(wrapper.get('.select-all').text()).toBe(result)
    await button(wrapper, 'Copy Password').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})

describe('Hash Generator', () => {
  it.each(['SHA-256', 'SHA-384', 'SHA-512'])('matches the full %s reference digest and copies it', async algorithm => {
    const wrapper = mountTool(Hash)
    await wrapper.get('textarea').setValue('abc')
    await wrapper.get('select').setValue(algorithm)
    await wrapper.get('form').trigger('submit')
    const expected = createHash(algorithm.replace('-', '').toLowerCase()).update('abc').digest('hex')
    await vi.waitFor(() => expect(wrapper.find('.select-all').text()).toBe(expected))
    await button(wrapper, 'Copy Hash').trigger('click')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expected)
  })

  it('hashes Unicode and whitespace without trimming', async () => {
    const wrapper = mountTool(Hash)
    const text = ' 日本語\nabc '
    await wrapper.get('textarea').setValue(text)
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('.select-all').text()).toBe(createHash('sha256').update(text).digest('hex')))
  })

  it('invalidates output after text/algorithm edits and restores defaults with Clear', async () => {
    const wrapper = mountTool(Hash)
    expect(button(wrapper, 'Generate Hash').attributes('disabled')).toBeDefined()
    await wrapper.get('textarea').setValue('abc')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(button(wrapper, 'Copy Hash').attributes('disabled')).toBeUndefined())
    await wrapper.get('select').setValue('SHA-512')
    expect(button(wrapper, 'Copy Hash').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('.select-all').text()).toHaveLength(128))
    await wrapper.get('textarea').setValue('changed')
    expect(wrapper.find('.select-all').exists()).toBe(false)
    await button(wrapper, 'Clear').trigger('click')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('')
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('SHA-256')
  })

  it('ignores a digest completed after Clear', async () => {
    const digest = deferred<ArrayBuffer>()
    vi.stubGlobal('crypto', { subtle: { digest: () => digest.promise } })
    const wrapper = mountTool(Hash)
    await wrapper.get('textarea').setValue('abc')
    await wrapper.get('form').trigger('submit')
    expect(button(wrapper, 'Generate Hash').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Clear').trigger('click')
    digest.resolve(new Uint8Array([1, 2]).buffer)
    await flushPromises()
    expect(wrapper.find('.select-all').exists()).toBe(false)
  })

  it('handles missing Web Crypto without leaving loading active', async () => {
    vi.stubGlobal('crypto', {})
    const wrapper = mountTool(Hash)
    await wrapper.get('textarea').setValue('abc')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Web Crypto')
    expect(button(wrapper, 'Generate Hash').attributes('disabled')).toBeUndefined()
  })

  it('preserves the hash on copy failure', async () => {
    const wrapper = mountTool(Hash)
    await wrapper.get('textarea').setValue('abc')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('.select-all').exists()).toBe(true))
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Denied'))
    await button(wrapper, 'Copy Hash').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('copy it manually')
    expect(wrapper.get('.select-all').text()).toHaveLength(64)
  })
})
