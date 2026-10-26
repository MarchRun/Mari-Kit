export const getPdfFileName = (
  sourceName = '',
  action: 'merged' | 'split' | 'organized' | `page-${number}`
): string => {
  const stem = sourceName
    .replace(/\.pdf$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-')
    .trim()
    .slice(0, 120)
    .replace(/[. ]+$/g, '')

  return `${stem || 'marikit'}-${action}.pdf`
}

export const getQrFileName = (date = new Date()): string => {
  const pad = (value: number) => String(value).padStart(2, '0')
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `marikit-qr-${day}-${time}.png`
}
