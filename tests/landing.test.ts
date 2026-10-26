import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Tools from '../ui/components/sections/ToolsSection.vue'
import Contact from '../ui/components/sections/ContactSection.vue'
import NavBar from '../ui/components/NavBar.vue'
import ToolCard from '../ui/components/ToolCard.vue'
import { button } from './helpers'

const link = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const options = { global: { components: { ToolCard }, stubs: { NuxtLink: link, BackgroundPattern: true, AtomAnimation: true } } }

beforeEach(() => {
  for (const [name, value] of Object.entries({ ref, watch, nextTick, onMounted, onBeforeUnmount })) vi.stubGlobal(name, value)
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1200 })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Tool discovery', () => {
  it('shows six desktop tools, then loads all seven unique routes', async () => {
    const wrapper = mount(Tools, options)
    expect(wrapper.findAllComponents(ToolCard)).toHaveLength(6)
    await button(wrapper, 'Load 1 more').trigger('click')
    const routes = wrapper.findAllComponents(ToolCard).map(card => card.get('a').attributes('href'))
    expect(routes).toEqual(['/pdf/merge', '/pdf/split', '/pdf/organize', '/qr/generator', '/qr/scanner', '/security/password', '/security/hash'])
    expect(wrapper.text()).toContain('Showing 7 of 7 tools')
  })

  it('uses batches of four at smaller viewport sizes', async () => {
    window.innerWidth = 500
    const wrapper = mount(Tools, options)
    await nextTick()
    expect(wrapper.findAllComponents(ToolCard)).toHaveLength(4)
    await button(wrapper, 'Load 3 more').trigger('click')
    expect(wrapper.findAllComponents(ToolCard)).toHaveLength(7)
  })

  it.each([['Documents', 3], ['QR Codes', 2], ['Security', 2]] as const)('filters %s', async (category, count) => {
    const wrapper = mount(Tools, options)
    await button(wrapper, category).trigger('click')
    expect(wrapper.findAllComponents(ToolCard)).toHaveLength(count)
    expect(button(wrapper, category).attributes('aria-pressed')).toBe('true')
  })

  it('searches trimmed case-insensitive titles, descriptions, and categories', async () => {
    const wrapper = mount(Tools, options)
    await wrapper.get('input[type="search"]').setValue('  hAsH  ')
    expect(wrapper.findAllComponents(ToolCard)).toHaveLength(1)
    expect(wrapper.findComponent(ToolCard).props('link')).toBe('/security/hash')
    await wrapper.get('input[type="search"]').setValue('device camera')
    expect(wrapper.findComponent(ToolCard).props('link')).toBe('/qr/scanner')
    await wrapper.get('input[type="search"]').setValue('Documents')
    expect(wrapper.findAllComponents(ToolCard)).toHaveLength(3)
  })

  it('combines filters, displays empty state, and clears the search', async () => {
    const wrapper = mount(Tools, options)
    await button(wrapper, 'Documents').trigger('click')
    await wrapper.get('input[type="search"]').setValue('QR')
    expect(wrapper.text()).toContain('No tools found')
    expect(wrapper.text()).toContain('0 tools found')
    await wrapper.get('button[aria-label="Clear search"]').trigger('click')
    expect(wrapper.findAllComponents(ToolCard)).toHaveLength(3)
    await button(wrapper, 'All').trigger('click')
    expect(wrapper.findAllComponents(ToolCard)).toHaveLength(6)
  })
})

describe('Contact unavailable state', () => {
  it('exposes input constraints and reports unavailable delivery without sending requests', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const wrapper = mount(Contact, options)
    expect(wrapper.get('input[name="name"]').attributes('required')).toBeDefined()
    expect(wrapper.get('input[name="email"]').attributes('type')).toBe('email')
    expect(wrapper.get('textarea').attributes('maxlength')).toBe('2000')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="status"]').text()).toContain('Message delivery is not available yet')
    expect(fetch).not.toHaveBeenCalled()
    expect(wrapper.get('a[href="https://github.com/MarchRun/MariKit"]').attributes('rel')).toBe('noopener noreferrer')
  })
})

describe('Navigation behavior', () => {
  it('opens/closes the menu through clicks, Escape, route changes, and desktop resize', async () => {
    const route = reactive({ path: '/pdf/split', fullPath: '/pdf/split' })
    vi.stubGlobal('useRoute', () => route)
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true }) })
    const wrapper = mount(NavBar, options)
    const toggle = wrapper.get('button')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    await wrapper.get('#mobile-navigation a').trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('#mobile-navigation').exists()).toBe(false)
    await toggle.trigger('click')
    route.fullPath = '/pdf/merge'
    await nextTick()
    expect(wrapper.find('#mobile-navigation').exists()).toBe(false)
    await toggle.trigger('click')
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.find('#mobile-navigation').exists()).toBe(false)
  })

  it('tracks visible landing sections and disconnects its observer on unmount', async () => {
    vi.stubGlobal('useRoute', () => ({ path: '/', fullPath: '/' }))
    let observeEntries!: (entries: { target: Element; isIntersecting: boolean }[]) => void
    const disconnect = vi.fn()
    const observe = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: typeof observeEntries) { observeEntries = callback }
      observe = observe
      disconnect = disconnect
    })
    const section = document.createElement('section')
    section.id = 'tools'
    document.body.append(section)
    const wrapper = mount(NavBar, options)
    await flushPromises()
    expect(observe).toHaveBeenCalledWith(section)
    observeEntries([{ target: section, isIntersecting: true }])
    await nextTick()
    expect(wrapper.get('a[href="/#tools"]').attributes('aria-current')).toBe('location')
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalled()
    section.remove()
  })
})
