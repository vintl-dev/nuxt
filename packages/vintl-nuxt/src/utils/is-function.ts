/**
 * Checks whether `typeof` for the provided value equals to `'function'`.
 *
 * The reason for such wrapper is to avoid TypeScript complaints because
 * behaviour of `typeof` in TypeScript is weird at best: if for `value` typeof
 * is a `'function'` in regular TypeScript, then TypeScript assumes it's `typeof
 * value & {}` (???) instead of just assuming that it `value` that extends
 * function.
 *
 * This wrapper will do just that, but its return type is set to return
 * assumption that `value` is all of `value` that extends function or never.
 *
 * Thus `isFunction(myValue)` where type of `myValue` is `(() => boolean) | (()
 * => number) | boolean | number`, it will return assumption that if this
 * function returns `true`, then `myValue` is one of `(() => boolean) | (() =>
 * number)`.
 *
 * The opposite applies - if type of `myValue` would be just `boolean | number`,
 * then it'd return an assumption that if this function returns `true`, then
 * `myValue` is of `never` type, which is correct, because this function is
 * never supposed to return `true` for that union type.
 *
 * Which is precisely the behaviour you'd expect from TypeScript, but oh well.
 *
 * @param value Value to check.
 * @returns Whether the typeof value equals to `'function'`.
 */
export function isFunction<T>(
  value: T,
): value is T extends (...args: any[]) => any ? T : never {
  return typeof value === 'function'
}
