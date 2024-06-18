import { isFunction } from './is-function.js'

/**
 * Represents a yet unresolved value of T.
 *
 * @template T Value of T.
 */
export type ValueOf<T> = T | (() => T | Promise<T>)

/**
 * Retrieves a direct value or getter of that value. Useful for values that will
 * not be used right away.
 *
 * @template T Type for the value.
 * @param value Yet unresolved value.
 * @returns Promise that resolves to `T` unless `T` is a function, in which case
 *   it resolves to either return type of `T` or `T`.
 *
 *   The reason for the latter behaviour is because there is no way to correctly
 *   check types for function during runtime.
 *
 *   So if, say, `T` is supposed to be `Resolver` (which `(thing: string) =>
 *   boolean`) and you pass in `myResolver`, which _is_ `Resolver`, this
 *   function will see that passed value was _just a function_ (it cannot know
 *   whether it was a resolver or getter (`() => Resolver`)), so it will call it
 *   **without arguments** as a regular getter, and return whatever it returns
 *   in case of such call (it may as well throw due to missing or illegal
 *   argument).
 *
 *   But if you were to call it with getter `() => myResolver`, then it would
 *   indeed return `myResolver`, which is `T`. Therefore return value of
 *   `Promise<ReturnType<T> | T>` is correct.
 *
 *   To avoid such behaviour, require values to be wrappers, e.g. in example above
 *   that'd be `{ resolve: Resolver }`. If you were pass a wrapper, then it
 *   would be instantly returned, but if you were to pass getter, it would also
 *   return getter, thus always `T`.
 */
export function retrieveValue<T>(
  value: ValueOf<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<T extends (...args: any[]) => infer R ? R | T : T> {
  return isFunction(value) ? value() : value
}
