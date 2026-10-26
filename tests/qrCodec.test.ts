import { createRequire } from 'node:module'
import { Blob as NodeBlob } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const encoder = require('qrcode') as typeof import('qrcode')
let decoderSource = ''

beforeAll(async () => {
  let workerBlob!: NodeBlob
  const source = readFileSync(require.resolve('qr-scanner/qr-scanner-worker.min.js'), 'utf8')
  const createWorker = runInNewContext(
    source.replace('export const createWorker', 'const createWorker') + '\ncreateWorker',
    {
      Blob: NodeBlob,
      URL: { createObjectURL: (blob: NodeBlob) => { workerBlob = blob; return 'blob:test' } },
      Worker: class {}
    }
  ) as () => void
  createWorker()
  decoderSource = await workerBlob.text()
})

const decode = (data: Uint8ClampedArray, width: number) => {
  const postMessage = vi.fn()
  const self = { postMessage, close() {}, onmessage: undefined as undefined | ((event: unknown) => void) }
  runInNewContext(decoderSource, { self })
  self.onmessage!({ data: { id: 1, type: 'decode', data: { data, width, height: width } } })
  return postMessage.mock.calls[0]![0].data
}

describe('Installed QR encoder and decoder integration', () => {
  it.each(['MariKit test', 'https://example.com', '日本語 café', 'javascript:alert(1)'])('round-trips %s through real pixel decoding', content => {
    const qr = encoder.create(content, { errorCorrectionLevel: 'M' })
    const scale = 8
    const margin = 4
    const width = (qr.modules.size + margin * 2) * scale
    const pixels = new Uint8ClampedArray(width * width * 4).fill(255)
    for (let y = 0; y < qr.modules.size; y += 1) {
      for (let x = 0; x < qr.modules.size; x += 1) {
        if (!qr.modules.get(y, x)) continue
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            const index = (((y + margin) * scale + dy) * width + (x + margin) * scale + dx) * 4
            pixels[index] = pixels[index + 1] = pixels[index + 2] = 0
          }
        }
      }
    }
    expect(decode(pixels, width)).toBe(content)
  })

  it('returns no QR for a plain image', () => {
    expect(decode(new Uint8ClampedArray(200 * 200 * 4).fill(255), 200)).toBeNull()
  })

  it('produces a valid PNG data URL with the real encoder', async () => {
    const url = await encoder.toDataURL('MariKit test', { width: 512, margin: 4 })
    expect(url).toMatch(/^data:image\/png;base64,/)
    const png = Buffer.from(url.split(',')[1]!, 'base64')
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })
})
