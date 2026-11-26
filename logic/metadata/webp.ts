import type { CleanResult } from './types'
import { asciiAt, concatBytes, readUint32, startsWithAscii, writeUint32 } from './bytes'
import { fail } from './types'

const removedChunks: Record<string, string> = {
  EXIF: 'EXIF metadata',
  'XMP ': 'XMP metadata'
}

const keptChunks: Record<string, string> = {
  ICCP: 'ICC colour profile',
  ALPH: 'Alpha channel',
  ANIM: 'Animation frames',
  ANMF: 'Animation frames'
}

export const cleanWebp = (input: Uint8Array): CleanResult => {
  if (!startsWithAscii(input, 'RIFF') || asciiAt(input, 8, 4) !== 'WEBP') {
    return fail('webp', 'corrupt', 'This file is not a valid WebP image.')
  }

  const removed = new Set<string>()
  const kept = new Set<string>()
  const chunks: Uint8Array[] = []
  let position = 12

  while (position + 8 <= input.length) {
    const size = readUint32(input, position + 4, true)

    if (size < 0 || position + 8 + size > input.length) {
      return fail('webp', 'corrupt', 'This WebP is damaged and cannot be read.')
    }

    const fourcc = asciiAt(input, position, 4)
    const dataEnd = position + 8 + size
    const label = removedChunks[fourcc]

    if (label) {
      removed.add(label)
    } else {
      const padding = size % 2
      const keepLabel = keptChunks[fourcc]

      if (keepLabel) {
        kept.add(keepLabel)
      }

      if (fourcc === 'VP8X' && size > 0 && ((input[position + 8] ?? 0) & 0x0c)) {
        const chunk = input.slice(position, dataEnd)
        chunk[8] = (chunk[8] ?? 0) & ~0x0c
        chunks.push(chunk)
      } else {
        chunks.push(input.subarray(position, dataEnd))
      }

      if (padding) {
        chunks.push(new Uint8Array([0]))
      }
    }

    position = dataEnd + (size % 2)
  }

  if (position < input.length || chunks.length === 0) {
    return fail('webp', 'corrupt', 'This WebP is damaged and cannot be read.')
  }

  const body = concatBytes(chunks)
  const output = new Uint8Array(12 + body.length)
  output.set([0x52, 0x49, 0x46, 0x46], 0)
  writeUint32(output, 4, body.length + 4, true)
  output.set([0x57, 0x45, 0x42, 0x50], 8)
  output.set(body, 12)

  return {
    ok: true,
    format: 'webp',
    output: removed.size ? output : input.slice(),
    removed: [...removed],
    kept: [...kept],
    notes: []
  }
}
