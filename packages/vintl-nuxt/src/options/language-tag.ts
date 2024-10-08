declare const _languageTagMarker: unique symbol

export type LanguageTagMarker = typeof _languageTagMarker

export type LanguageTag = string & { [K in LanguageTagMarker]: true }

export function assertLanguageTagValid(
  input: unknown,
): asserts input is LanguageTag {
  if (typeof input !== 'string') {
    throw new TypeError('Language tag must be a string')
  }

  try {
    new Intl.Locale(input)
  } catch {
    throw new RangeError('Language tag must be a valid BCP 47 language tag')
  }
}
