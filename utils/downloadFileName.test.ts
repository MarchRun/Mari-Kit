import { describe, expect, it } from 'vitest'
import { getPdfFileName, getQrFileName } from './downloadFileName'

describe('PDF download names', () => {
  it('uses the source name and the action', () => {
    expect(getPdfFileName('skripsi.PDF', 'split')).toBe('skripsi-split.pdf')
    expect(getPdfFileName('skripsi.pdf', 'merged')).toBe('skripsi-merged.pdf')
    expect(getPdfFileName('skripsi.pdf', 'organized')).toBe('skripsi-organized.pdf')
    expect(getPdfFileName('skripsi.pdf', 'page-2')).toBe('skripsi-page-2.pdf')
  })

  it('preserves spaces and Unicode while removing unsafe filename characters', () => {
    expect(getPdfFileName('Laporan Akhir 日本語.pdf', 'split')).toBe('Laporan Akhir 日本語-split.pdf')
    expect(getPdfFileName('a/b\\c:d?e*.pdf', 'split')).toBe('a-b-c-d-e--split.pdf')
  })

  it('provides a fallback and limits long names', () => {
    expect(getPdfFileName('.pdf', 'split')).toBe('marikit-split.pdf')
    expect(getPdfFileName(undefined, 'merged')).toBe('marikit-merged.pdf')
    expect(getPdfFileName('a'.repeat(500) + '.pdf', 'organized')).toBe('a'.repeat(120) + '-organized.pdf')
  })
})

describe('QR download names', () => {
  it('uses the local date and time with zero padding', () => {
    expect(getQrFileName(new Date(2026, 0, 2, 3, 4, 5))).toBe('marikit-qr-20260102-030405.png')
  })
})
