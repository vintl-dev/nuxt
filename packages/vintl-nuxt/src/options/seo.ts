export interface SEOOptions {
  /**
   * Whether the SEO features are enabled.
   *
   * @default true // Seo features are enabled.
   */
  enabled?: boolean

  /**
   * Name of the host language URL parameter, used to override the default or
   * user language.
   *
   * @default 'hl' // ?hl=de in the URL will force German (if it is defined).
   */
  hostLanguageParameter?: string

  /**
   * Base URL at which the site will be available. This is required to generate
   * absolute hreflang links. Without this, VIntl will try to guess the URL
   * based on the server request URL / current `window.location`.
   */
  baseURL?: string

  /**
   * Whether to use the host language parameter for the default locale.
   *
   * This option helps to keep URLs for your default language clean, however it
   * is not correct, and is not recommended, because the lack of the host
   * language parameter tells VIntl to use the user locale (whether it's the one
   * they've chosen or their browser's one).
   *
   * @default true // All hreflang links have the host language parameter, including the default one.
   */
  defaultLocaleHasParameter?: boolean

  /**
   * Whether to enable `x-default` hreflang.
   *
   * Disabling this is not recommended.
   *
   * @default true // There is a x-default hreflang.
   */
  xDefaultHreflang?: boolean
}

export function normalizeSEOOptions(input: SEOOptions) {
  return {
    enabled: input.enabled ?? true,
    hostLanguageParameter: input.hostLanguageParameter ?? 'hl',
    baseURL: input.baseURL,
    defaultLocaleHasParameter: input.defaultLocaleHasParameter ?? true,
    xDefaultHreflang: input.xDefaultHreflang ?? true,
  } as const
}

export type NormalizedSEOOptions = ReturnType<typeof normalizeSEOOptions>
