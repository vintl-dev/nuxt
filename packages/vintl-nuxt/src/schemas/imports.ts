import { z as t } from 'zod'
import { tSwitch } from '../utils/zod-utils.js'

/** A schema for an object containing import source and custom export name. */
export const importSourceObjectSchema = t.object({
  /** Module source relative to the `options.resolveDir`. */
  from: t.string({
    invalid_type_error: 'Import source must be a string',
  }),

  /** Custom export name. */
  name: t
    .string({
      invalid_type_error: 'Export name must be a string',
    })
    .default('default'),

  /** Whether to resolve the import to a path or import as is. */
  resolve: t.boolean().default(true),
})

/** A schema for the tuple consisting of an import path and a custom export name. */
export const importSourceTupleSchema = t.tuple([
  t
    .string({
      required_error: 'A path must be provided',
      invalid_type_error: 'Import path must be a string',
    })
    .describe(
      'Import path from where the export with the name provided as a second element of the tuple is imported',
    ),
  t
    .string({
      required_error: 'A custom export name must be provided',
      invalid_type_error: 'Custom export name must be a string',
    })
    .describe('Custom export name')
    .default('default'),
])

/**
 * A schema for a union of import source path or a tuple with import source path
 * and a custom export name.
 */
export const importSourceSchema = tSwitch((value) => {
  if (typeof value === 'string') {
    return t
      .string()
      .transform((from) => ({ from }))
      .pipe(importSourceObjectSchema)
  } else if (Array.isArray(value)) {
    return importSourceTupleSchema
      .transform(([from, name]) => ({ from, name }))
      .pipe(importSourceObjectSchema)
  } else if (typeof value === 'object' && value !== null) {
    return importSourceObjectSchema
  }
})

/**
 * A schema for an import source without any specifiers (side-effect only
 * import).
 */
export const unspecifiedImportSourceObjectSchema =
  importSourceObjectSchema.omit({ name: true })

/**
 * A schema for an import source without any specifiers (side-effect only
 * import) in two form: a string or an object.
 */
export const unspecifiedImportSourceSchema = tSwitch((value) => {
  if (typeof value === 'string') {
    return t
      .string()
      .transform((from) => ({ from }))
      .pipe(unspecifiedImportSourceObjectSchema)
  } else if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return unspecifiedImportSourceObjectSchema
  }
})
