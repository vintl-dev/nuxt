/** Represents a Vite/Rollup plugin API interface. */
export interface API {
  /**
   * Checks whether the provided ID matches the configured filters of the
   * plugin.
   *
   * @param id ID of the module.
   */
  filter(id: string): boolean
}

/**
 * Checks whether the provided value conforms to the API interface.
 *
 * @param value The value to check.
 * @returns Whether the value conforms to the API interface.
 */
export function isAPI(value: unknown): value is API {
  return value != null && typeof value === 'object' && 'filter' in value
}
