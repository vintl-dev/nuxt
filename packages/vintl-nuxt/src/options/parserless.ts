/**
 * Represents a condition of a parserless mode.
 *
 * - `always` - parserless mode is always enabled, even in development.
 * - `only-prod` - parserless mode is only enabled when compiling production
 *   build.
 * - `never` - parserless mode is never enabled.
 */
export type ParserlessMode = 'always' | 'only-prod' | 'never'

export function isParserlessMode(input: unknown): input is ParserlessMode {
  return input === 'always' || input === 'only-prod' || input === 'never'
}

export type ParserlessModeValue = boolean | ParserlessMode

export function isParserlessModeValue(
  input: unknown,
): input is ParserlessModeValue {
  return typeof input === 'boolean' || isParserlessMode(input)
}

export function normalizeParserlessModeValue(input: ParserlessModeValue) {
  if (typeof input === 'boolean') {
    return input ? 'always' : 'never'
  }

  if (typeof input === 'string') {
    return input
  }

  throw new Error(
    'Cannot normalize an input that does not appear to be a parserless mode value',
  )
}

export interface ParserlessModeOptions {
  /**
   * Whether the parserless mode is enabled or under which condition.
   *
   * @default false // Parserless mode is never enabled.
   */
  enabled?: ParserlessModeValue
}

export function isParserlessModeOptions(
  input: unknown,
): input is ParserlessModeOptions {
  return (
    input != null &&
    typeof input === 'object' &&
    (!('enabled' in input) ||
      input.enabled === undefined ||
      isParserlessModeValue(input.enabled))
  )
}

export function normalizeParserlessModeOptions(input: ParserlessModeOptions) {
  return {
    enabled: normalizeParserlessModeValue(input.enabled ?? false),
  } as const
}

export type ParserlessModeInput = ParserlessModeValue | ParserlessModeOptions

export function normalizeParserlessModeInput(input: ParserlessModeInput) {
  if (isParserlessModeOptions(input)) {
    return normalizeParserlessModeOptions(input)
  }

  if (isParserlessModeValue(input)) {
    return normalizeParserlessModeOptions({ enabled: input })
  }

  throw new Error(
    'Cannot normalize an input that does not appear to be a parserless mode input',
  )
}
