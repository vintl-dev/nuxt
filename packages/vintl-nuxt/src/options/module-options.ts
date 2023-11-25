import {
  normalizeLocaleDescriptor,
  type LocaleDescriptor,
  assertLocaleDescriptorValid,
} from './locale-descriptor.ts'
import { normalizeSEOOptions, type SEOOptions } from './seo.ts'
import {
  normalizeParserlessModeInput,
  type ParserlessModeOptions,
  type ParserlessModeValue,
} from './parserless.ts'
import {
  type ParseErrorHandlingOption,
  isParseErrorHandlingOption,
} from './parse-errors.ts'
import {
  specialErrorMessage,
  type ErrorWithSpecialMessage,
} from '../utils/error.ts'

/** Represents either a name of the built-in storage option or a module ID. */
export type StorageOptionValue =
  | 'localStorage'
  | 'cookie'
  | (string & Record<never, never>)

export interface ModuleOptions {
  /**
   * BCP 47 language tag of the locale to use by default.
   *
   * @default 'en-US'
   */
  defaultLocale?: string

  /**
   * A directory from where all the locale imports are being resolved.
   *
   * If this contains a relative path, that path will be resolved against the
   * Nuxt's `srcDir` directory.
   *
   * @default '.' // Modules will be resolved from the Nuxt'
   */
  resolveDir?: string

  /**
   * An array of locale definitions.
   *
   * At least one locale must be defined, and none should be duplicated.
   *
   * @example
   *   ;({
   *     tag: 'en-US',
   *     files: [
   *       {
   *         from: '@acne/site-translations',
   *         name: 'en_us',
   *         resolve: false,
   *       },
   *     ],
   *   })
   */
  locales: LocaleDescriptor[]

  /* Either a string containing a built-in storage option or a module ID to import. */
  storage?: StorageOptionValue

  /**
   * Whether to use `BroadcastChannel` (if it's available) to synchronise the
   * locale between multiple open tabs on the same origin.
   *
   * @default true // Broadcasts locale changes to other open tabs.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
   */
  broadcastLocaleChange?: boolean

  /**
   * Name of the host language URL parameter, used to override the default or
   * user language. Set to `null` to disable, the SEO tags generation will be
   * disabled as well.
   *
   * @deprecated Use `seo` options instead.
   * @default 'hl' // ?hl=de to use German (if it is defined).
   */
  hostLanguageParam?: string | null

  /** SEO configuration options. */
  seo?: SEOOptions

  /**
   * Configuration options for the parserless mode.
   *
   * @default { enabled: 'only-prod' } // Enabled only in production
   */
  parserless?: ParserlessModeValue | ParserlessModeOptions

  onParseError?: ParseErrorHandlingOption
}

export function normalizeModuleOptions(input: ModuleOptions) {
  const {
    defaultLocale,
    resolveDir,
    locales,
    parserless,
    broadcastLocaleChange,
    storage,
    seo,
    onParseError,
  } = input

  let seoResult
  if (seo === undefined) {
    let { hostLanguageParam } = input

    if (hostLanguageParam === undefined) {
      hostLanguageParam = 'hl'
    }

    seoResult = normalizeSEOOptions({
      enabled: hostLanguageParam != null,
      hostLanguageParameter: hostLanguageParam ?? undefined,
    })
  } else {
    seoResult = normalizeSEOOptions(seo)
  }

  return {
    defaultLocale: defaultLocale ?? 'en-US',
    resolveDir: resolveDir ?? '.',
    locales: locales.map((locale) => normalizeLocaleDescriptor(locale)),
    broadcastLocaleChange: broadcastLocaleChange ?? false,
    seo: seoResult,
    storage,
    parserless: normalizeParserlessModeInput(
      parserless ?? { enabled: 'only-prod' },
    ),
    onParseError,
  }
}

export type NormalizedModuleOptions = ReturnType<typeof normalizeModuleOptions>

interface IssuesMap {
  /** Duplicate indexes. */
  tags: Map<string, number[]>

  /** Duplicate hreflangs. */
  hreflangs: Map<string, number[]>
}

export class DuplicateLocalesError
  extends RangeError
  implements ErrorWithSpecialMessage
{
  public constructor(public readonly issues: IssuesMap) {
    super('Your module options contain duplicate locale tags or hreflangs')
  }

  [specialErrorMessage]() {
    let { message } = this

    let duplicateTags: string | undefined

    for (const [tag, indexes] of this.issues.tags.entries()) {
      if (indexes.length < 2) continue
      if (duplicateTags == null) duplicateTags = 'Duplicate tags:'
      duplicateTags += `\n- Locale tag "${tag}" is defined several times at indexes `
      duplicateTags += indexes.join(', ')
    }

    if (duplicateTags != null) message += `\n${duplicateTags}`

    let duplicateHreflangs: string | undefined

    for (const [hreflang, indexes] of this.issues.hreflangs.entries()) {
      if (indexes.length < 2) continue
      if (duplicateHreflangs == null) {
        duplicateHreflangs = 'Duplicate hreflangs:'
      }
      duplicateHreflangs += `\n- Hreflang "${hreflang}" is defined several times at indexes `
      duplicateHreflangs += indexes.join(', ')
    }

    if (duplicateTags != null) message += '\n'
    if (duplicateHreflangs != null) message += `\n${duplicateHreflangs}`

    return message
  }
}

export function assertModuleOptionsValid(options: NormalizedModuleOptions) {
  const errors: unknown[] = []

  const { locales, onParseError } = options

  if (locales.length === 0) {
    errors.push(
      new RangeError('Module options are missing any locale definitions'),
    )
  }

  const localeTagIndexes = new Map<string, number[]>()
  const hrefLangIndexes = new Map<string, number[]>()

  let hasDuplicates = false

  for (let i = 0, l = locales.length; i < l; i++) {
    const locale = locales[i]

    try {
      assertLocaleDescriptorValid(locale)
    } catch (cause) {
      errors.push(
        new RangeError(`Assertion failed for locale definition at index ${i}`, {
          cause,
        }),
      )
    }

    {
      const prevIndexes = localeTagIndexes.get(locale.tag)
      if (prevIndexes == null) {
        localeTagIndexes.set(locale.tag, [i])
      } else {
        prevIndexes.push(i)
        hasDuplicates = true
      }
    }

    {
      const hrefLang = locale.meta?.static?.iso ?? locale.tag
      const prevIndexes = hrefLangIndexes.get(hrefLang)
      if (prevIndexes == null) {
        hrefLangIndexes.set(hrefLang, [i])
      } else {
        prevIndexes.push(i)
        hasDuplicates = true
      }
    }
  }

  if (hasDuplicates) {
    errors.push(
      new DuplicateLocalesError({
        tags: localeTagIndexes,
        hreflangs: hrefLangIndexes,
      }),
    )
  }

  if (onParseError != null && !isParseErrorHandlingOption(onParseError)) {
    errors.push(new RangeError('Value for `onParseError` is invalid'))
  }

  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      'Module options have failed one or more assertions',
    )
  }
}
