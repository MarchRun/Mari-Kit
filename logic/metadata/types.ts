export type MetadataFormat = 'jpeg' | 'png' | 'webp' | 'svg' | 'pdf'

export type MetadataFailureCode = 'unsupported' | 'corrupt' | 'encrypted'

export type CleanResult =
  | {
      ok: true
      format: MetadataFormat
      output: Uint8Array
      removed: string[]
      kept: string[]
      notes: string[]
    }
  | {
      ok: false
      format: MetadataFormat | 'unknown'
      code: MetadataFailureCode
      message: string
    }

export const formatLabels: Record<MetadataFormat, string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WebP',
  svg: 'SVG',
  pdf: 'PDF'
}

export const supportedFormatList = 'JPEG, PNG, WebP, SVG, and PDF'

export const fail = (
  format: MetadataFormat | 'unknown',
  code: MetadataFailureCode,
  message: string
): CleanResult => ({ ok: false, format, code, message })
