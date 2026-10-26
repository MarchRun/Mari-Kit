export const maxFileBytes = 100_000_000

export const getFileSizeError = (
  files: readonly { size: number }[],
  currentTotalBytes = 0
): string => {
  if (files.some(file => file.size > maxFileBytes)) {
    return 'Each file must be 100 MB or smaller. Choose a smaller file.'
  }

  if (files.reduce((total, file) => total + file.size, currentTotalBytes) > maxFileBytes) {
    return 'The combined file size must not exceed 100 MB. Remove files or choose smaller ones.'
  }

  return ''
}
