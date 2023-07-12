import { z as t } from 'zod'
import { tSwitch } from '../utils/zod-utils.js'
import { languageTagSchema } from './language-tag.js'
import { localeDescriptorSchema } from './locales.js'
import { seoOptions } from './seo.js'

const parselessModeEnumSchema = t.enum(['always', 'only-prod', 'never'])

export const parselessModeSchema = tSwitch((value) => {
  if (typeof value === 'string') {
    return parselessModeEnumSchema
  } else if (typeof value === 'boolean') {
    return t
      .boolean()
      .transform((value) => (value ? 'always' : 'never'))
      .pipe(parselessModeEnumSchema)
  }
})

export const parselessOptionsSchema = t
  .object({
    /** Specifies whether the parseless mode is enabled. */
    enabled: parselessModeSchema.optional().default(false),
  })
  .describe('Options for the parseless mode')

export const storageValueSchema = t.custom<
  'localStorage' | 'cookie' | (string & Record<never, never>)
>((value) => {
  return t.string().safeParse(value).success
}, 'Storage name must be a string')

export const moduleOptionsSchema = t
  .object({
    /**
     * BCP 47 code of the locale to use by default.
     *
     * @default 'en-US' // American English will be used as a default locale.
     */
    defaultLocale: languageTagSchema.default('en-US'),

    /**
     * A directory where all the imports associated with the locales are being
     * resolved.
     *
     * If it's relative, then it will be resolved against the Nuxt `srcDir`
     * directory.
     *
     * @default '.' // Modules will be resolved from Nuxt srcDir.
     */
    resolveDir: t
      .string()
      .describe('Directory where all the imports are being resolved')
      .default('.'),

    /** An array of all the configured locales. */
    locales: t
      .array(localeDescriptorSchema)
      .min(1, {
        message: 'Must define at least one locale',
      })
      .superRefine((locales, ctx) => {
        const localeTagIndexes = new Map<string, number[]>()
        const hrefLangIndexes = new Map<string, number[]>()
        // const conflicts = new Map<
        //   number,
        //   {
        //     tags: number[]
        //     hreflangs: number[]
        //   }
        // >()

        // const mapConflicts = (localeIndex: number) => {
        //   let ret = conflicts.get(localeIndex)
        //   if (ret == null) {
        //     ret = {
        //       tags: [],
        //       hreflangs: [],
        //     }
        //     conflicts.set(localeIndex, ret)
        //   }
        //   return ret
        // }

        // const uniquePush = <T>(arr: T[], value: T) => {
        //   if (arr.includes(value)) {
        //     return
        //   }
        //   arr.push(value)
        // }

        for (let i = 0, l = locales.length; i < l; i++) {
          const locale = locales[i]!

          {
            const prevIndexes = localeTagIndexes.get(locale.tag)
            if (prevIndexes === undefined) {
              localeTagIndexes.set(locale.tag, [i])
            } else {
              prevIndexes.push(i)
            }
          }

          {
            const hrefLang = locale.meta?.static?.iso ?? locale.tag
            const prevIndexes = hrefLangIndexes.get(hrefLang)
            if (prevIndexes === undefined) {
              hrefLangIndexes.set(hrefLang, [i])
            } else {
              prevIndexes.push(i)
            }
          }
        }

        for (const [tag, indexes] of localeTagIndexes) {
          if (indexes.length < 2) continue
          ctx.addIssue({
            code: 'custom',
            params: {
              type: 'language_tag_conflicts',
              tag,
              indexes,
            },
            message: `Language "${tag}" is defined multiple times at indexes ${indexes.join(
              ', ',
            )}`,
          })
        }

        for (const [hrefLang, indexes] of hrefLangIndexes) {
          if (indexes.length < 2) continue
          ctx.addIssue({
            code: 'custom',
            params: {
              type: 'hreflang_conflicts',
              hrefLang,
              indexes,
            },
            message: `Multiple occurances of hreflang "${hrefLang}" at indexes ${indexes.join(
              ', ',
            )}`,
          })
        }
      }),

    /**
     * Either a built-in storage name (localStorage / cookie), node module name
     * or path to a file that exports an adapter as default export.
     */
    storage: storageValueSchema.optional(),

    /**
     * Whether to use `BroadcastChannel` (if available) to synchronise locale
     * change between multiple tabs on the same origin.
     *
     * @default true // Broadcasts locale changes to other tabs.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
     */
    broadcastLocaleChange: t
      .boolean()
      .describe(
        'A boolean value that specifies whether the `BroadcastChannel` is used to synchronise locale changes between multiple tabs on the same origin.',
      )
      .default(true),

    /**
     * Name of the host language URL parameter, used to override the default or
     * user language. `null` to disable. If this value is `null`, the SEO tags
     * generation will be disabled.
     *
     * @deprecated Use `seo` options instead.
     * @default 'hl' // For example, ?hl=en to use English locale (if defined).
     */
    hostLanguageParam: t
      .string()
      .describe(
        'Name of the host language URL parameter, used to override the default or user language.',
      )
      .optional()
      .nullable(),

    seo: seoOptions.optional(),

    /**
     * Configuration options for the parserless mode, a mode in which the parser
     * is removed from runtime and all strings are processed during the initial
     * build, which can have drastic bundle size reduction and performance
     * improvements. The tradeoff, however, is that no messages can be parsed
     * anymore, they all will have to be processed beforehand.
     *
     * Parserless mode is still an experimental feature and will continue to
     * improve with time.
     */
    parserless: tSwitch((value) => {
      if (typeof value === 'string') {
        return parselessModeSchema
          .transform((value) => ({ enabled: value }))
          .pipe(parselessOptionsSchema)
      } else if (typeof value === 'object' && value !== null) {
        return parselessOptionsSchema
      }
    }).default('only-prod'),
  })
  .transform((from) => {
    if (from.seo === undefined) {
      let hostLanguageParam = from.hostLanguageParam
      if (hostLanguageParam === undefined) {
        hostLanguageParam = 'hl'
      }

      from.seo = seoOptions.parse({
        enabled: hostLanguageParam != null,
        hostLanguageParameter: hostLanguageParam ?? undefined,
      })
    }

    return from as typeof from & { seo: t.output<typeof seoOptions> }
  })
  .refine((value) => {
    return value.locales.some((locale) => locale.tag === value.defaultLocale)
  }, 'Default locale must be defined')
