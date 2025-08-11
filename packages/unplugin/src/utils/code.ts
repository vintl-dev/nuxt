/**
 * Checks whether the provided code has singns of being already transformed.
 *
 * @param code The code to check.
 * @returns Whether the code has already been transformed.
 */
export function isTransformed(code_: string) {
  const code = code_.trim()

  for (const badToken of ['const', 'let', 'var', 'export', 'import']) {
    if (code.startsWith(badToken)) return true
  }

  return false
}
