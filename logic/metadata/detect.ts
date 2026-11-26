import type { MetadataFormat } from './types'
import { asciiAt, startsWithAscii, startsWithBytes } from './bytes'

const svgPreview = (bytes: Uint8Array): string => {
  const length = Math.min(bytes.length, 4096)
  let text = ''

  for (let index = 0; index < length; index += 1) {
    text += String.fromCharCode(bytes[index]!)
  }

  return text
}

export const detectFormat = (bytes: Uint8Array): MetadataFormat | null => {
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) {
    return 'jpeg'
  }

  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'png'
  }

  if (startsWithAscii(bytes, 'RIFF') && asciiAt(bytes, 8, 4) === 'WEBP') {
    return 'webp'
  }

  if (startsWithAscii(bytes, '%PDF-')) {
    return 'pdf'
  }

  const text = svgPreview(bytes)
  const trimmed = text.replace(/^\uFEFF/, '').replace(/^\s+/, '')

  if (
    /^<(\?xml|!--|!doctype|svg)/i.test(trimmed)
    && /<svg[\s>]/i.test(trimmed)
  ) {
    return 'svg'
  }

  return null
}
