export const concatBytes = (parts: readonly Uint8Array[]): Uint8Array => {
  let total = 0

  for (const part of parts) {
    total += part.length
  }

  const output = new Uint8Array(total)
  let offset = 0

  for (const part of parts) {
    output.set(part, offset)
    offset += part.length
  }

  return output
}

export const readUint16 = (
  bytes: Uint8Array,
  offset: number,
  littleEndian = false
): number => {
  if (offset + 2 > bytes.length) {
    return -1
  }

  const first = bytes[offset]!
  const second = bytes[offset + 1]!

  return littleEndian
    ? first | (second << 8)
    : (first << 8) | second
}

export const readUint32 = (
  bytes: Uint8Array,
  offset: number,
  littleEndian = false
): number => {
  if (offset + 4 > bytes.length) {
    return -1
  }

  const a = bytes[offset]!
  const b = bytes[offset + 1]!
  const c = bytes[offset + 2]!
  const d = bytes[offset + 3]!

  if (littleEndian) {
    return (a | (b << 8) | (c << 16) | (d << 24)) >>> 0
  }

  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0
}

export const writeUint32 = (
  target: Uint8Array,
  offset: number,
  value: number,
  littleEndian = false
): void => {
  if (littleEndian) {
    target[offset] = value & 0xff
    target[offset + 1] = (value >>> 8) & 0xff
    target[offset + 2] = (value >>> 16) & 0xff
    target[offset + 3] = (value >>> 24) & 0xff
    return
  }

  target[offset] = (value >>> 24) & 0xff
  target[offset + 1] = (value >>> 16) & 0xff
  target[offset + 2] = (value >>> 8) & 0xff
  target[offset + 3] = value & 0xff
}

export const asciiAt = (
  bytes: Uint8Array,
  offset: number,
  length: number
): string => {
  if (offset + length > bytes.length) {
    return ''
  }

  let text = ''

  for (let index = 0; index < length; index += 1) {
    text += String.fromCharCode(bytes[offset + index]!)
  }

  return text
}

export const startsWithBytes = (
  bytes: Uint8Array,
  prefix: readonly number[]
): boolean => prefix.every((value, index) => bytes[index] === value)

export const startsWithAscii = (
  bytes: Uint8Array,
  prefix: string
): boolean => {
  if (bytes.length < prefix.length) {
    return false
  }

  for (let index = 0; index < prefix.length; index += 1) {
    if (bytes[index] !== prefix.charCodeAt(index)) {
      return false
    }
  }

  return true
}
