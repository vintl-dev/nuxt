type TypeOfTypes =
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'symbol'
  | 'undefined'
  | 'object'
  | 'function'

type TypeOf<T extends TypeOfTypes> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : T extends 'bigint'
  ? bigint
  : T extends 'boolean'
  ? boolean
  : T extends 'symbol'
  ? symbol
  : T extends 'undefined'
  ? undefined
  : T extends 'object'
  ? Record<PropertyKey, unknown> | null
  : T extends 'function'
  ? (this: unknown, ...args: unknown[]) => unknown
  : never

/**
 * Uses `typeof` expression to check type of the file, provides TypeScript type
 * assertion.
 *
 * @param type Type to use for checking, any valid return value by `typeof`
 *   expression.
 * @param value Value to check using `typeof`.
 * @returns Whether the result of `typeof` expression for the `value` matches
 *   {@link type}.
 */
export function isOfType<T extends TypeOfTypes>(
  type: T,
  value: unknown,
): value is TypeOf<T> {
  return typeof value === type
}
