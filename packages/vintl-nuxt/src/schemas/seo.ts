import { z as t } from 'zod'

export const seoOptions = t.object({
  /** Whether CEO features are enabled. */
  enabled: t.boolean().default(true),

  /**
   * Name of the host language URL parameter, used to override the default or
   * user language.
   *
   * @default 'hl' // For example, ?hl=en to use English locale (if defined).
   */
  hostLanguageParameter: t
    .string()
    .describe(
      'Name of the host language URL parameter, used to override the default or user language.',
    )
    .optional()
    .default('hl'),

  /**
   * Base URL at which the site will be available. This is required to generate
   * absolute hreflang links. Without this, VIntl will try to guess the URL
   * based on the server request URL / current `window.location`.
   */
  baseURL: t
    .string()
    .describe(
      'Base URL at which the site will be available. This is required to generate absolute hreflang links. ',
    )
    .optional(),

  /**
   * Whether to use the host language parameter for the default locale.
   *
   * This options helps keep URLs for your default language clean, however it is
   * not correct, and is not recommended, because lack of the host language
   * parameter tells VIntl to use the user locale (whether it's the one they've
   * choosen before or their browser's one).
   */
  defaultLocaleHasParameter: t.boolean().default(true),

  /** Whether to enable `x-default` hreflang. */
  xDefaultHreflang: t.boolean().default(true),
})
