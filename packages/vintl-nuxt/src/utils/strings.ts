export function indent(value: string, padding: number | string = 0) {
  if (value.length === 0) return ''

  let pad: string
  if (typeof padding === 'number') {
    pad = ' '.repeat(padding)
  } else {
    pad = String(padding)
  }

  const paddedValue = value.replace(/(\r?\n|\r)/g, (match) => `${match}${pad}`)

  return `${pad}${paddedValue}`
}
