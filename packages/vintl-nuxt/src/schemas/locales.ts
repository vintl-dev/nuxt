import { z as t } from 'zod'
import { importSourceSchema, unspecifiedImportSourceSchema } from './imports.js'
import { jsonValueSchema } from './json.js'
import { languageTagSchema } from './language-tag.js'
import { messagesImportSourceSchema } from './messages-imports.js'

export const localeMetaSchema = t
  .object({
    /** Properties that are used by VIntl. */
    static: t
      .object({
        /**
         * If there's a case where BCP 47 language tag wouldn't match `hreflang`
         * specification, which is ISO 639-1 for language code and optionally,
         * dash and ISO 3166-1 code of the country, this value must be
         * specified.
         *
         * @see [Google Search Central — Tell Google about localized versions of your page § Language codes](https://developers.google.com/search/docs/specialty/international/localized-versions#language-codes)
         */
        iso: t
          .string()
          .refine((v) => v !== 'x-default', 'Must not be x-default')
          .optional(), // how about to go crazy and validate it lol
      })
      .describe('Static properties used by VIntl library')
      .optional(),
  })
  .catchall(jsonValueSchema.optional())
  .refine(
    (value) => {
      try {
        JSON.stringify(value)
        return true
      } catch (err) {
        return false
      }
    },
    { message: 'Locale meta must be JSON serialisable' },
  )

export const localeDescriptorSchema = t
  .object({
    /**
     * BCP 47 language of the locale.
     *
     * @see https://www.w3.org/International/questions/qa-choosing-language-tags W3 guide on choosing the language tags.
     */
    tag: languageTagSchema,

    /**
     * A source of import for the messages file, which is resolved against the
     * {@link Options.resolveDir}. If {@link files} option specified together with
     * this option, this messages file will be imported before any other file
     * defined in {@link files}.
     */
    file: messagesImportSourceSchema.optional(),

    /**
     * BCP 47 language tag of the locale.
     *
     * @see https://www.w3.org/International/questions/qa-choosing-language-tags W3 guide on choosing the language tags.
     */
    files: t.array(messagesImportSourceSchema).optional(),

    /** List of additional side-effect only imports (like polyfill data). */
    additionalImports: t
      .array(unspecifiedImportSourceSchema)
      .describe(
        'List of additional side-effect only imports (like polyfill data)',
      )
      .optional(),

    /**
     * An array of mapped resource imports.
     *
     * Unlike additional imports, which are used for side effects, these imports
     * will be mapped to provided key in runtime.
     *
     * This is useful for language-associated documents, which would otherwise
     * create frustrating experience for translators be they left as regular
     * strings in the messages file.
     */
    resources: t.record(importSourceSchema).optional(),

    /**
     * Custom meta for the locale that is always accessible even when the locale
     * is not loaded.
     *
     * It can be used to store data like translation coverage percentage, or
     * display names. Keep in mind, it needs to be JSON serialisable.
     */
    meta: localeMetaSchema.optional(),
  })
  .refine(
    (value) => {
      return value.file != null || value.files != null
    },
    {
      message:
        'LocaleDescriptor must contain at least one of `file` or `files`',
    },
  )
