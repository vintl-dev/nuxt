import type { ZodError, ZodIssue } from 'zod'
import pico from 'picocolors'

function isEqualArray<T>(a: T[], b: T[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * A simple boolean flag.
 *
 * @returns Object with getter to retrieve the value of the flag and toggle it.
 */
function flag() {
  let value = false

  return {
    get value() {
      return value
    },
    toggleIf(v = false) {
      if (v) value = true

      return this
    },
  }
}

class PathedMap<T> extends Map<PropertyKey[], T> {
  public get(path: PropertyKey[]) {
    if (super.has(path)) return super.get(path)

    for (const [key, value] of this.entries()) {
      if (isEqualArray(key, path)) return value
    }

    return undefined
  }

  public set(path: PropertyKey[], value: T) {
    this.delete(path)
    super.set(path, value)
    return this
  }

  public delete(path: PropertyKey[]) {
    const deletions = flag()
    deletions.toggleIf(super.delete(path))

    for (const [key] of this.entries()) {
      if (isEqualArray(key, path)) {
        deletions.toggleIf(super.delete(key))
      }
    }

    return deletions.value
  }

  public has(path: PropertyKey[]) {
    if (super.has(path)) return true

    for (const key of this.keys()) {
      if (isEqualArray(key, path)) return true
    }

    return false
  }

  public getOrSet(path: PropertyKey[], initializer: () => T) {
    let v: T | undefined = this.get(path)
    if (v !== undefined) return v
    v = initializer()
    super.set(path, v)
    return v
  }
}

/**
 * Property name to best of our ability. In actuality property keys rules are
 * far more complex.
 */
const propertyKeyRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

/**
 * Converts property name to a readable form.
 *
 * @example
 *   toPropertyName('hello') // => 'hello'
 *   toPropretyName('dashed-key') // => '["dashed-key"]'
 *   toPropertyName(Symbol('test')) // => '[Symbol(test)]'
 *   toPropertyName(0) // => '[0]'
 *
 * @param prop Original property key.
 * @returns Property key in readable form.
 */
function toPropertyName(
  prop: PropertyKey,
): readonly [name: string, wrapped: boolean] {
  if (
    typeof prop === 'symbol' ||
    typeof prop === 'number' ||
    !Number.isNaN(Number(prop))
  ) {
    return [`[${String(prop)}]`, true]
  }

  return propertyKeyRegex.test(prop)
    ? [prop, false]
    : [`[${JSON.stringify(prop)}]`, true]
}

/**
 * Gets a standard property prefix for bullet points.
 *
 * @example
 *   toPropertyPrefix('hello') // => '.hello: '
 *   toPropertyPrefix('dashed-key') // => '.["dashed-key"]: '
 *   toPropertyPrefix(Symbol('test')) // => '.[Symbol(test)]: '
 *   toPropertyPrefix(0) // => '.[0]: '
 *   toPropertyPrefix(undefined) // => ''
 *
 * @param prop Original property key or `undefined` for empty prefix.
 */
function toPropertyPrefix(prop: PropertyKey | undefined) {
  if (prop === undefined) return ''
  return `${pico.cyan(toPropertyName(prop)[0])}: `
}

export function formatZodError<T>(
  e: ZodError<T>,
  {
    initialMessage = 'Validation error',
    rootPropertyName = '<root>',
  }: {
    /**
     * Initial message displayed right at the top.
     *
     * @default 'Validation error'
     */
    initialMessage?: string
    /**
     * Name of the root property.
     *
     * @default '<root>'
     */
    rootPropertyName?: string
  },
) {
  const allBullets = new PathedMap<Set<string>>()
  const createSet = () => new Set<string>()

  for (const issue of e.issues) {
    const prop = issue.path.slice(-1)[0]
    const parentPath = issue.path.slice(0, -1)
    const msg = issue.message

    let bullet = issue.fatal === true ? pico.red('×') : pico.yellow('▲')
    bullet += ` ${toPropertyPrefix(prop)}${msg}`

    allBullets.getOrSet(parentPath, createSet).add(bullet)
  }

  let message = pico.bold(pico.red(initialMessage))

  for (const [path, bullets] of allBullets.entries()) {
    const jointPath = path.reduce<string>((v, prop) => {
      const [name, wrapped] = toPropertyName(prop)
      return v + (wrapped ? name : `.${name}`)
    }, rootPropertyName)

    let jointBullets = ''
    {
      const bulletsIt = bullets.values()
      let bullet = bulletsIt.next()
      while (!bullet.done) {
        jointBullets += ` ${bullet.value}`
        bullet = bulletsIt.next()
        if (!bullet.done) jointBullets += '\n'
      }
    }

    message += `\n\n${pico.bold(pico.cyan(jointPath))}\n${jointBullets}`
  }

  return message.endsWith('\n') ? message.slice(0, -1) : message
}
