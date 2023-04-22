import { z as t } from 'zod'
import { tSwitch } from '../utils/zod-utils.js'

/**
 * Checks if provided value is an acceptable JSON literal.
 *
 * @param value The value to check.
 * @returns `true` if the value is a JSON literal, `false` otherwise.
 */
function isLiteral(value: unknown): value is string | number | boolean | null {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  )
}

const literalSchema = tSwitch((value) => {
  switch (typeof value) {
    case 'string':
      return t.string()
    case 'number':
      return t.number()
    case 'boolean':
      return t.boolean()
  }

  switch (value) {
    case null:
      return t.null()
    case undefined:
      return t.undefined()
  }
})

type Literal = t.infer<typeof literalSchema>

type JSONValue = Literal | { [key: string]: JSONValue } | JSONValue[]

export const jsonValueSchema: t.ZodType<JSONValue> = t.lazy(() =>
  tSwitch((value) => {
    if (isLiteral(value)) {
      return literalSchema
    } else if (Array.isArray(value)) {
      return t.array(jsonValueSchema)
    } else if (typeof value === 'object') {
      return t.record(jsonValueSchema)
    }
  }),
)
