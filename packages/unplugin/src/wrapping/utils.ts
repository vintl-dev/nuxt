/**
 * Checks whether the plugin wrapping is supported by the provided framework.
 *
 * @param framework Framework name to check in lower case.
 * @returns Whether the framework is one of the supported frameworks.
 */
export function isSupportedLoader(
  framework: string,
): framework is 'rollup' | 'vite' {
  return framework === 'rollup' || framework === 'vite'
}
