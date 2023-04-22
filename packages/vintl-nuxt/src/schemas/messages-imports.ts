import { z as t } from 'zod'
import { tSwitch } from '../utils/zod-utils.js'
import { importObjectSchema, importSourceTupleSchema } from './imports.js'

export const messagesImportFormatterName = t.string({
  invalid_type_error: 'Format must be a string',
})

export const messagesImportFormatterFunction = t.function(
  t.tuple([t.unknown()]),
  t.record(t.string()),
)

/** A schema for the locale import options. */
export const messagesImportOptionsSchema = t.object({
  /** Format of the messages file, either CLI name or . */
  format: tSwitch((value) => {
    if (typeof value === 'string') {
      return messagesImportFormatterName
    } else if (typeof value === 'function') {
      return messagesImportFormatterFunction
    }
  }).default('default'),

  /**
   * A function that parses the imported file into a JS object later used by the
   * formatter.
   */
  parser: t
    .function(
      t.tuple([t.string().describe('Code'), t.string().describe('Module ID')]),
      t.any().describe('Output used by the formatter'),
    )
    .optional(),
})

export const messagesImportSourceObjectSchema = importObjectSchema.merge(
  messagesImportOptionsSchema,
)

// const _messagesImportSourceSchema = t.union([
//   t.string(),
//   importSourceWithSpecifierSchema,
//   messagesImportSourceObjectSchema,
// ])

// /** A schema for the locale import source. */
// export const messagesImportSourceSchema = t.any().transform((value, ctx) => {
//   if (Array.isArray(value)) {
//     const r = messagesImportSourceObjectSchema.safeParse({
//       source: value[0],
//       name: value[1],
//     })
//     if (r.success) {
//       return r.data
//     } else {
//       r.error.issues.forEach((i) => ctx.addIssue(i))
//       return undefined as never
//     }
//   } else if (typeof value === 'string') {
//     const r = messagesImportSourceObjectSchema.safeParse({
//       source: value,
//     })
//     if (r.success) {
//       return r.data
//     } else {
//       r.error.issues.forEach((i) => ctx.addIssue(i))
//       return undefined as never
//     }
//   } else if (typeof value === 'object' && value != null) {
//     const r = messagesImportSourceObjectSchema.safeParse(value)
//     if (r.success) {
//       return r.data
//     } else {
//       r.error.issues.forEach((i) => ctx.addIssue(i))
//       return undefined as never
//     }
//   }

//   {
//     const r = t.never().safeParse(value)
//     if (r.success) {
//       return r.data
//     } else {
//       r.error.issues.forEach((i) => ctx.addIssue(i))
//       return undefined as never
//     }
//   }
// }) as unknown as typeof _messagesImportSourceSchema

export const messagesImportSourceSchema = tSwitch((value) => {
  if (Array.isArray(value)) {
    return importSourceTupleSchema
      .transform((v) => ({ from: v[0], name: v[1] }))
      .pipe(messagesImportSourceObjectSchema)
  } else if (typeof value === 'string') {
    return t
      .string()
      .transform((v) => ({ from: v }))
      .pipe(messagesImportSourceObjectSchema)
  } else if (typeof value === 'object' && value != null) {
    return messagesImportSourceObjectSchema
  }
})

// type In = t.input<typeof messagesImportSourceSchema>
// type Out = t.output<typeof messagesImportSourceSchema>
