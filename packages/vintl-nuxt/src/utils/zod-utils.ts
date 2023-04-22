import { z as t } from 'zod'

/**
 * Schema based on the input value.
 *
 * @param match A function that takes an input value and returns a schema.
 * @param params Optional parameters for the returned interceptor schema, as
 *   well as `no_match_error`, which is reported as an issue when matcher method
 *   does not return any schema.
 * @returns An interceptor schema that mimics all schemas returned by
 *   `switcher`, as they were in union.
 * @unstable This is a dirty hack.
 */
export function tSwitch<R extends t.ZodTypeAny>(
  match: (value: unknown) => R | undefined,
  params?: t.RawCreateParams & { no_match_error?: string },
): t.ZodEffects<R> {
  return t.unknown(params).transform((value, ctx) => {
    const schema = match(value)

    if (schema == null) {
      ctx.addIssue({
        code: 'custom',
        params: { code: 'no_match' },
        message: params?.no_match_error ?? 'Invalid input',
      })

      return undefined as never
    }

    const r = schema.safeParse(value)

    if (r.success) {
      return r.data
    } else {
      r.error.issues.forEach((i) => ctx.addIssue(i))
      return undefined as never
    }
  }) as t.ZodEffects<t.infer<R>, t.output<R>, t.input<R>>
}
