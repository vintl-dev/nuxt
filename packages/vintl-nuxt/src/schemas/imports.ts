import { z as t } from 'zod'

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
export const importSourceSchema = t
  .union([
    t
      .string({
        required_error: 'A path must be provided',
        invalid_type_error: 'Import path must be a string',
      })
      .describe('Import path from where the `default` export is imported'),
    importSourceTupleSchema,
  ])
  .transform((value) => {
    if (typeof value === 'string') {
      return [value, 'default'] as t.infer<typeof importSourceTupleSchema>
    }
    return value
  })

/** A schema for an object containing import source and custom export name. */
export const importObjectSchema = t.object({
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
})

/** A schema for an extended import source that also accepts objects. */
export const extImportSourceSchema = importSourceSchema
  .or(importObjectSchema)
  .transform((i) => (Array.isArray(i) ? i : importSourceSchema.parse(i)))
