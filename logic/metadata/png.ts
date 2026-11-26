import type { CleanResult } from './types'
import { asciiAt, concatBytes, readUint32, startsWithBytes } from './bytes'
import { fail } from './types'

const removedChunks: Record<string, string> = {
  eXIf: 'EXIF metadata',
  tEXt: 'Text metadata',
  zTXt: 'Compressed text metadata',
  iTXt: 'International text metadata',
  tIME: 'Modification time'
}

export const cleanPng = (input: Uint8Array): CleanResult => {
  if (!startsWithBytes(input, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return fail('png', 'corrupt', 'This file is not a valid PNG image.')
  }

  const removed = new Set<string>()
  const kept = new Set<string>()
  const parts: Uint8Array[] = [input.subarray(0, 8)]
  let position = 8
  let foundEnd = false

  while (position + 12 <= input.length) {
    const length = readUint32(input, position)

    if (length < 0 || position + 12 + length > input.length) {
      return fail('png', 'corrupt', 'This PNG is damaged and cannot be read.')
    }

    const type = asciiAt(input, position + 4, 4)

    if (!/^[A-Za-z]{4}$/.test(type)) {
      return fail('png', 'corrupt', 'This PNG is damaged and cannot be read.')
    }

    const chunkEnd = position + 12 + length
    const label = removedChunks[type]

    if (label) {
      removed.add(label)
    } else {
      parts.push(input.subarray(position, chunkEnd))

      if (type === 'iCCP') {
        kept.add('ICC colour profile')
      }
    }

    position = chunkEnd

    if (type === 'IEND') {
      foundEnd = true
      break
    }
  }

  if (!foundEnd) {
    return fail('png', 'corrupt', 'This PNG is damaged and cannot be read.')
  }

  if (position < input.length) {
    parts.push(input.subarray(position))
  }

  return {
    ok: true,
    format: 'png',
    output: removed.size ? concatBytes(parts) : input.slice(),
    removed: [...removed],
    kept: [...kept],
    notes: []
  }
}
