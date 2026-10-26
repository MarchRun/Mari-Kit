import { EncryptedPDFError } from 'pdf-lib'

const encryptedPdfMessage = new EncryptedPDFError().message

export const isEncryptedPdfError = (error: unknown): boolean =>
  error instanceof EncryptedPDFError || (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && error.message === encryptedPdfMessage
  )
