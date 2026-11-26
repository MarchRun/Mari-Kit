import { PDFDict, PDFDocument, PDFName } from 'pdf-lib'
import type { CleanResult } from './types'
import { fail } from './types'

const infoKeys = [
  'Title',
  'Author',
  'Subject',
  'Keywords',
  'Creator',
  'Producer',
  'CreationDate',
  'ModDate'
]

const looksEncrypted = (bytes: Uint8Array): boolean => {
  const start = Math.max(0, bytes.length - 8192)
  let text = ''

  for (let index = start; index < bytes.length; index += 1) {
    text += String.fromCharCode(bytes[index]!)
  }

  return /\/Encrypt\s/.test(text)
}

export const cleanPdf = async (input: Uint8Array): Promise<CleanResult> => {
  if (looksEncrypted(input)) {
    return fail(
      'pdf',
      'encrypted',
      'This PDF is password-protected. Remove the password before cleaning it.'
    )
  }

  let document: PDFDocument

  try {
    document = await PDFDocument.load(input, { updateMetadata: false })
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : ''

    if (message.includes('encrypt')) {
      return fail(
        'pdf',
        'encrypted',
        'This PDF is password-protected. Remove the password before cleaning it.'
      )
    }

    return fail('pdf', 'corrupt', 'This PDF is damaged and cannot be read.')
  }

  const removed: string[] = []

  try {
    const infoReference = document.context.trailerInfo.Info
    const info = infoReference
      ? document.context.lookup(infoReference, PDFDict)
      : undefined

    if (info) {
      for (const key of infoKeys) {
        const name = PDFName.of(key)

        if (info.has(name)) {
          info.delete(name)
          removed.push(key === 'Producer' ? 'Producer software' : key)
        }
      }
    }

    if (document.catalog.has(PDFName.of('Metadata'))) {
      document.catalog.delete(PDFName.of('Metadata'))
      removed.push('XMP metadata')
    }
  } catch {
    return fail('pdf', 'corrupt', 'This PDF is damaged and cannot be read.')
  }

  if (removed.length === 0) {
    return {
      ok: true,
      format: 'pdf',
      output: input.slice(),
      removed: [],
      kept: [],
      notes: []
    }
  }

  const saved = await document.save()

  return {
    ok: true,
    format: 'pdf',
    output: new Uint8Array(saved),
    removed,
    kept: ['Page content'],
    notes: []
  }
}
