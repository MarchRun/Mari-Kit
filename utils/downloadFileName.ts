import type { MetadataFormat } from '~/logic/metadata/types'

const sanitizeFileStem = (value: string): string =>
  value
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-')
    .trim()
    .slice(0, 120)
    .replace(/[. ]+$/g, '')

const removeExtension = (fileName: string): string =>
  fileName.replace(/\.[^./\\]+$/, '')

export const getPdfFileName = (
  sourceName = '',
  action: 'merged' | 'split' | 'organized' | `page-${number}`
): string => {
  const stem = sanitizeFileStem(removeExtension(sourceName).replace(/\.pdf$/i, ''))

  return `${stem || 'marikit'}-${action}.pdf`
}

export const getQrFileName = (date = new Date()): string => {
  const pad = (value: number) => String(value).padStart(2, '0')
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `marikit-qr-${day}-${time}.png`
}

const formatExtensions: Record<MetadataFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  svg: 'svg',
  pdf: 'pdf'
}

const acceptedExtensions: Record<MetadataFormat, string[]> = {
  jpeg: ['jpg', 'jpeg'],
  png: ['png'],
  webp: ['webp'],
  svg: ['svg'],
  pdf: ['pdf']
}

export const getCleanedFileName = (
  sourceName: string,
  format: MetadataFormat
): string => {
  const match = /\.([A-Za-z0-9]+)$/.exec(sourceName)
  const sourceExtension = match?.[1]?.toLowerCase()
  const extension = sourceExtension && acceptedExtensions[format].includes(sourceExtension)
    ? sourceExtension
    : formatExtensions[format]
  const stem = sanitizeFileStem(removeExtension(sourceName))

  return `${stem || 'marikit'}-clean.${extension}`
}
