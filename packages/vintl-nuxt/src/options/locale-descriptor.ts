import {
  normalizeUnspecifiedImportSource,
  type ImportSource,
  type NormalizedUnspecifiedImportSourceObject,
  type UnspecifiedImportSource,
  type NormalizedImportSourceObject,
  normalizeImportSource,
} from './imports.ts'
import { assertLanguageTagValid } from './language-tag.ts'
import {
  normalizeMessagesImportSource,
  type MessagesImportSource,
  type NormalizedMessagesImportSource,
} from './message-imports.ts'

type Literal = string | number | boolean | null | undefined

type JSONValue = Literal | { [key: string]: JSONValue } | JSONValue[]

/** Represents static locale metadata used by VIntl. */
export type LocaleStaticMeta = {
  /**
   * Hreflang attribute value.
   *
   * If there's a case where BCP 47 language does not align with `hreflang`
   * specification, which requires an ISO 639-1 language code and optionally,
   * ISO 3166-1 code of the country preceded by a dash character, this property
   * can be used to override the value.
   *
   * @example
   *   'en-US'
   */
  iso?: string
}

/** Represents locale metadata. */
export interface LocaleMeta {
  /** Static properties used by VIntl. */
  static?: LocaleStaticMeta
  [key: string]: JSONValue
}

export interface LocaleDescriptor {
  /** BCP 47 language tag associated with the locale. */
  tag: string

  /** An import source of the first messages file to load. */
  file?: MessagesImportSource

  /** An array of import sources of the messages file to load. */
  files?: MessagesImportSource[]

  /**
   * An array of import sources for side-effect only imports (like polyfill
   * data).
   */
  additionalImports?: UnspecifiedImportSource[]

  /**
   * A record of resource imports where keys are resource names and values are
   * import sources.
   *
   * Unlike additional imports, which are only used for side effects, these
   * imports will be mapped to the provided key at runtime.
   *
   * This is useful for larger language-associated documents, which would
   * otherwise create a frustrating experience for translators were these
   * documents left as regular strings in the messages file. However, this is
   * not limited to just documents, but anything that can be imported.
   */
  resources?: Record<string, ImportSource>

  /**
   * Custom metadata for the locale that is always accessible at runtime, even
   * if the locale is not loaded.
   *
   * Use it for data like the translations coverage percentage, or display
   * names. It must be JSON serialisable.
   */
  meta?: LocaleMeta
}

export function normalizeLocaleDescriptor(input: LocaleDescriptor) {
  const files: NormalizedMessagesImportSource[] = []

  if (input.file != null) {
    files.push(normalizeMessagesImportSource(input.file))
  }

  if (input.files != null) {
    for (const source of input.files) {
      files.push(normalizeMessagesImportSource(source))
    }
  }

  const additionalImports: NormalizedUnspecifiedImportSourceObject[] = []

  if (input.additionalImports != null) {
    for (const source of input.additionalImports) {
      additionalImports.push(normalizeUnspecifiedImportSource(source))
    }
  }

  let resources: Record<string, NormalizedImportSourceObject> | undefined
  if (input.resources != null) {
    resources = Object.create(null)
    for (const [name, source] of Object.entries(input.resources)) {
      resources![name] = normalizeImportSource(source)
    }
  }

  const { tag, meta } = input

  return {
    tag,
    files,
    additionalImports,
    resources,
    meta,
  } as const
}

export type NormalizedLocaleDescriptor = ReturnType<
  typeof normalizeLocaleDescriptor
>

export function assertLocaleDescriptorValid(input: NormalizedLocaleDescriptor) {
  const errors: unknown[] = []
  try {
    assertLanguageTagValid(input.tag)
  } catch (err) {
    errors.push(err)
  }

  if (input.files.length === 0) {
    errors.push(new RangeError('Locale descriptor is missing any source files'))
  }

  try {
    JSON.stringify(input.meta)
  } catch (err) {
    errors.push(
      new RangeError(
        'Locale descriptor contains meta that cannot be serialized to JSON',
        { cause: err },
      ),
    )
  }

  if (input?.meta?.static?.iso === 'x-default') {
    errors.push(new RangeError('Locale descriptor uses x-default as ISO code'))
  }

  if (errors.length !== 0) {
    throw new AggregateError(
      errors,
      'Locale descriptor has failed one or more assertions',
    )
  }
}
