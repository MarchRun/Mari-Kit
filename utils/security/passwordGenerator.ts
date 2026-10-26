const characterSets: Record<string, string> = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
}

export const generatePassword = (
  length = 16,
  characterTypes = Object.keys(characterSets)
): string => {
  const sets = [...new Set(characterTypes)].map(type => characterSets[type])

  if (!Number.isInteger(length) || length < 8 || length > 128 || !sets.length || sets.some(set => !set)) {
    throw new Error('Choose a length from 8 to 128 and at least one valid character type.')
  }

  const pool = sets.join('')
  const limit = 256 - (256 % pool.length)
  const bytes = new Uint8Array(256)

  while (true) {
    let password = ''

    while (password.length < length) {
      crypto.getRandomValues(bytes)

      for (const byte of bytes) {
        if (byte < limit) {
          password += pool[byte % pool.length]
          if (password.length === length) break
        }
      }
    }

    if (sets.every(set => [...password].some(character => set!.includes(character)))) {
      return password
    }
  }
}
