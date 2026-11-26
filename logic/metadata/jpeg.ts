import type { CleanResult } from './types'
import { concatBytes, readUint16, readUint32, startsWithBytes } from './bytes'
import { fail } from './types'

const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]
const xmpIdentifier = 'http://ns.adobe.com/xap/1.0/'

const isExif = (payload: Uint8Array): boolean =>
  exifHeader.every((value, index) => payload[index] === value)

const isXmp = (payload: Uint8Array): boolean => {
  if (payload.length < xmpIdentifier.length) {
    return false
  }

  for (let index = 0; index < xmpIdentifier.length; index += 1) {
    if (payload[index] !== xmpIdentifier.charCodeAt(index)) {
      return false
    }
  }

  return true
}

export const readJpegOrientation = (payload: Uint8Array): number | null => {
  if (!isExif(payload) || payload.length < 14) {
    return null
  }

  const tiff = payload.subarray(6)
  const littleEndian = tiff[0] === 0x49 && tiff[1] === 0x49

  if (!littleEndian && !(tiff[0] === 0x4d && tiff[1] === 0x4d)) {
    return null
  }

  if (readUint16(tiff, 2, littleEndian) !== 42) {
    return null
  }

  const directory = readUint32(tiff, 4, littleEndian)

  if (directory < 8 || directory + 2 > tiff.length) {
    return null
  }

  const count = readUint16(tiff, directory, littleEndian)

  for (let index = 0; index < count; index += 1) {
    const entry = directory + 2 + index * 12

    if (entry + 12 > tiff.length) {
      return null
    }

    if (readUint16(tiff, entry, littleEndian) === 0x0112) {
      const value = readUint16(tiff, entry + 8, littleEndian)
      return value > 0 ? value : null
    }
  }

  return null
}

const orientationSegment = (orientation: number): Uint8Array => {
  const payload = concatBytes([
    new Uint8Array(exifHeader),
    new Uint8Array([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00,
      0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00,
      orientation & 0xff, (orientation >> 8) & 0xff, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00
    ])
  ])

  return concatBytes([
    new Uint8Array([0xff, 0xe1]),
    new Uint8Array([((payload.length + 2) >> 8) & 0xff, (payload.length + 2) & 0xff]),
    payload
  ])
}

export const cleanJpeg = (input: Uint8Array): CleanResult => {
  if (!startsWithBytes(input, [0xff, 0xd8, 0xff])) {
    return fail('jpeg', 'corrupt', 'This file is not a valid JPEG image.')
  }

  const removed = new Set<string>()
  const kept = new Set<string>()
  const notes: string[] = []
  const parts: Uint8Array[] = [input.subarray(0, 2)]
  let orientation: number | null = null
  let position = 2

  while (position + 1 < input.length) {
    if (input[position] !== 0xff) {
      return fail('jpeg', 'corrupt', 'This JPEG is damaged and cannot be read.')
    }

    let markerPosition = position

    while (markerPosition + 1 < input.length && input[markerPosition + 1] === 0xff) {
      markerPosition += 1
    }

    const marker = input[markerPosition + 1]

    if (marker === undefined) {
      return fail('jpeg', 'corrupt', 'This JPEG is damaged and cannot be read.')
    }

    if (marker === 0xd9) {
      parts.push(input.subarray(markerPosition))
      position = input.length
      break
    }

    if (marker === 0xda) {
      parts.push(input.subarray(markerPosition))
      position = input.length
      break
    }

    const length = readUint16(input, markerPosition + 2)

    if (length < 2 || markerPosition + 2 + length > input.length) {
      return fail('jpeg', 'corrupt', 'This JPEG is damaged and cannot be read.')
    }

    const payloadStart = markerPosition + 4
    const payload = input.subarray(payloadStart, markerPosition + 2 + length)
    const segment = input.subarray(markerPosition, markerPosition + 2 + length)
    let keep = true

    if (marker === 0xe1 && isExif(payload)) {
      keep = false
      removed.add('EXIF data')
      orientation ??= readJpegOrientation(payload)
    } else if (marker === 0xe1 && isXmp(payload)) {
      keep = false
      removed.add('XMP metadata')
    } else if (marker === 0xed) {
      keep = false
      removed.add('IPTC metadata')
    } else if (marker === 0xfe) {
      keep = false
      removed.add('Comment')
    } else if (marker === 0xe2) {
      kept.add('ICC colour profile')
    }

    if (keep) {
      parts.push(segment)
    }

    position = markerPosition + 2 + length
  }

  if (position < input.length) {
    return fail('jpeg', 'corrupt', 'This JPEG is damaged and cannot be read.')
  }

  if (orientation !== null && orientation !== 1) {
    parts.splice(1, 0, orientationSegment(orientation))
    notes.push('The orientation tag was kept so the image does not rotate in viewers.')
  }

  return {
    ok: true,
    format: 'jpeg',
    output: removed.size ? concatBytes(parts) : input.slice(),
    removed: [...removed],
    kept: [...kept],
    notes
  }
}
