// todo: see if there's a way to ship this to consumers?

declare namespace VueIntlController {
  interface LocaleMeta {
    /** Static properties used by VIntl. */
    static?: {
      /**
       * If there's a case where BCP 47 language tag wouldn't match `hreflang`
       * specification, which is ISO 639-1 for language code and optionally,
       * dash and ISO 3166-1 code of the country, this value must be specified.
       *
       * @see [Google Search Central — Tell Google about localized versions of your page § Language codes](https://developers.google.com/search/docs/specialty/international/localized-versions#language-codes)
       */
      iso?: string
    }
  }
}
