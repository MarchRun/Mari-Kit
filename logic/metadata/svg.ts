import type { CleanResult } from './types'
import { fail } from './types'

const editorPrefixes = new Set([
  'inkscape',
  'sodipodi',
  'illustrator',
  'sketch',
  'figma'
])

const isScriptTarget = (value: string): boolean =>
  value.trim().toLowerCase().startsWith('javascript:')

export const cleanSvg = (input: Uint8Array): CleanResult => {
  const source = new TextDecoder().decode(input)

  if (!source.trim()) {
    return fail('svg', 'corrupt', 'This SVG file is empty or damaged.')
  }

  const document = new DOMParser().parseFromString(source, 'image/svg+xml')

  if (document.querySelector('parsererror')) {
    return fail('svg', 'corrupt', 'This SVG file cannot be parsed.')
  }

  const root = document.documentElement

  if (!root || root.localName !== 'svg') {
    return fail('svg', 'corrupt', 'This file is not a valid SVG image.')
  }

  const removed = new Set<string>()
  const elements = Array.from(document.getElementsByTagName('*'))

  for (const element of elements) {
    if (element.localName === 'metadata') {
      removed.add('Document metadata')
      element.remove()
      continue
    }

    if (element.localName === 'script') {
      removed.add('Scripting')
      element.remove()
      continue
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name

      if (/^on/i.test(name) || isScriptTarget(attribute.value)) {
        removed.add('Scripting')
        element.removeAttribute(name)
        continue
      }

      if (name.toLowerCase().startsWith('xmlns:') && editorPrefixes.has(name.slice(6))) {
        removed.add('Editor namespaces')
        element.removeAttribute(name)
        continue
      }

      if (attribute.prefix && editorPrefixes.has(attribute.prefix)) {
        removed.add('Editor attributes')
        element.removeAttribute(name)
      }
    }
  }

  const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT)
  const comments: Node[] = []

  while (walker.nextNode()) {
    comments.push(walker.currentNode)
  }

  for (const comment of comments) {
    removed.add('XML comments')
    comment.parentNode?.removeChild(comment)
  }

  if (removed.size === 0) {
    return {
      ok: true,
      format: 'svg',
      output: input.slice(),
      removed: [],
      kept: [],
      notes: []
    }
  }

  const serialized = new XMLSerializer().serializeToString(root)

  return {
    ok: true,
    format: 'svg',
    output: new TextEncoder().encode(serialized),
    removed: [...removed],
    kept: ['Artwork, title, and description'],
    notes: []
  }
}
