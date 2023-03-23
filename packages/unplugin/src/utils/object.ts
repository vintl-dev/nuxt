/**
 * Accepts an object as input and checks whether the object is `undefined`,
 * `null`, or does not has own properties.
 *
 * @param value An object to check.
 * @returns Whether the object is `undefined`, `null`, or has no own properties.
 */
export function isEmptyObject(value?: Record<string, any>): boolean {
  if (value != null) {
    for (const key in value) {
      if (Object.hasOwn(value, key)) return false
    }
  }

  return true
}
