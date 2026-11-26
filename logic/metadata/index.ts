import type { CleanResult, MetadataFormat } from './types'
import { detectFormat } from './detect'
import { cleanJpeg } from './jpeg'
import { cleanPng } from './png'
import { cleanWebp } from './webp'
import { cleanSvg } from './svg'
import { cleanPdf } from './pdf'
import { fail, supportedFormatList } from './types'

export type { CleanResult, MetadataFormat } from './types'
export { formatLabels, supportedFormatList } from './types'
export { detectFormat } from './detect'

export const cleanFile = async (input: Uint8Array): Promise<CleanResult> => {
  const format = detectFormat(input)

  if (!format) {
    return fail(
      'unknown',
      'unsupported',
      `This file type is not supported. Supported formats: ${supportedFormatList}.`
    )
  }

  try {
    switch (format) {
      case 'jpeg':
        return cleanJpeg(input)
      case 'png':
        return cleanPng(input)
      case 'webp':
        return cleanWebp(input)
      case 'svg':
        return cleanSvg(input)
      case 'pdf':
        return await cleanPdf(input)
    }
  } catch {
    return fail(format, 'corrupt', `This ${format.toUpperCase()} file is damaged and cannot be cleaned.`)
  }
}
