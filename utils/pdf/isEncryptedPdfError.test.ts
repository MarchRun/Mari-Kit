import { describe, expect, it } from 'vitest'
import { EncryptedPDFError } from 'pdf-lib'
import { isEncryptedPdfError } from './isEncryptedPdfError'

describe('isEncryptedPdfError', () => {
  it('recognizes the error emitted by pdf-lib', () => {
    expect(isEncryptedPdfError(new EncryptedPDFError())).toBe(true)
  })

  it('does not label unrelated failures as encryption', () => {
    for (const error of [null, undefined, 'encrypted', {}, new Error('Invalid PDF'), new RangeError('Invalid page')]) {
      expect(isEncryptedPdfError(error)).toBe(false)
    }
  })
})
