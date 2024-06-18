import {
  normalizeImportSourceObject,
  isImportSourceTuple,
  isImportSourceObject,
  type ImportSourceObject,
  type ImportSourceTuple,
  type ImportSourceString,
} from './imports.ts'

/**
 * An optional name of the messages formatter.
 *
 * @example
 *   const crowdinFormatter: MessagesImportFormatterName = 'crowdin'
 *
 * @default 'default'
 */
export type MessagesImportFormatterName = string | undefined | null

export function isMessagesImportFormatterName(
  input: unknown,
): input is MessagesImportFormatterName {
  return input == null || typeof input === 'string'
}

export function normalizeMessagesImportFormatterName(
  input: MessagesImportFormatterName,
) {
  return input ?? 'default'
}

/**
 * Represents a function that receives parsed messages file content and returns
 * a map for creation of the parsed message bundle.
 *
 * @param input Parsed contents of the messages file.
 * @returns A record where message IDs are used as properties and messages
 *   themselves as values.
 */
export type MessagesImportFormatterFunction<I> = (
  input: I,
) => Record<string, string>

export type MessagesImportFormatter<I> =
  | MessagesImportFormatterName
  | MessagesImportFormatterFunction<I>

export function normalizeMessagesImportFormatter<I>(
  input: MessagesImportFormatter<I>,
) {
  if (isMessagesImportFormatterName(input)) {
    return normalizeMessagesImportFormatterName(input)
  }

  if (typeof input === 'function') {
    return input
  }

  throw new Error(
    'Cannot normalize an input that does not appear to be a messages import formatter',
  )
}

export type NormalizedMessagesImportFormatter = ReturnType<
  typeof normalizeMessagesImportFormatter
>

/**
 * Represents a function that receives messages file content and its module ID
 * and parses it into a value that is later used by the formatter.
 *
 * @example
 *   const jsonParser: MessagesImportParser<unknown> = (code) =>
 *     JSON.parse(code)
 *
 * @param code Messages file contents to parse.
 * @param moduleId Module ID of the messages file.
 * @returns A value later used by the formatter.
 */
export type MessagesImportParser<R> = (code: string, moduleId: string) => R

export interface MessagesImportOptions<V = unknown> {
  /**
   * A function that receives file contents and produces an output that will be
   * used by the formatter.
   */
  parser?: MessagesImportParser<V>

  /**
   * Either a function or a name of the built-in formatted which formats the
   * parsed output into a record with message IDs as properties and messages
   * themselves as values.
   */
  format?: MessagesImportFormatter<V>
}

export function isMessagesImportOptions(
  input: unknown,
): input is MessagesImportOptions<unknown> {
  return (
    input != null &&
    typeof input === 'object' &&
    (!('parser' in input) ||
      input.parser == null ||
      typeof input.parser === 'function') &&
    (!('format' in input) ||
      input.format == null ||
      typeof input.format === 'string' ||
      typeof input.format === 'function')
  )
}

export function normalizeMessagesImportOptions<V = unknown>(
  input: MessagesImportOptions<V>,
) {
  return {
    format: normalizeMessagesImportFormatter(input.format),
    parser: input.parser,
  } as const
}

export type NormalizedMessagesImportOptions<V = unknown> = ReturnType<
  typeof normalizeMessagesImportOptions<V>
>

export type MessagesImportSourceObject<V = unknown> = Omit<
  ImportSourceObject,
  'resolve'
> &
  MessagesImportOptions<V>

export function isMessagesImportSourceObject(
  input: unknown,
): input is MessagesImportSourceObject {
  let filteredInput
  if (typeof input === 'object' && input != null) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { resolve: _ignored, ...rest } = input as Record<string, unknown>
    filteredInput = rest
  }
  return (
    isImportSourceObject(filteredInput) &&
    isMessagesImportOptions(filteredInput)
  )
}

export function normalizeMessagesImportSourceObject<V>(
  input: MessagesImportSourceObject<V>,
) {
  const { from, name } = normalizeImportSourceObject(input)
  return {
    from,
    name,
    ...normalizeMessagesImportOptions(input),
  } as const
}

/** Describes an import source in a form of a string, a tuple, or an object. */
export type MessagesImportSource =
  | ImportSourceString
  | ImportSourceTuple
  | MessagesImportSourceObject

export function normalizeMessagesImportSource(input: MessagesImportSource) {
  if (typeof input === 'string') {
    return normalizeMessagesImportSourceObject({ from: input })
  }

  if (isImportSourceTuple(input)) {
    const [from, name] = input
    return normalizeMessagesImportSourceObject({ from, name })
  }

  if (isMessagesImportSourceObject(input)) {
    return normalizeMessagesImportSourceObject(input)
  }

  throw new Error(
    'Cannot normalize an input that does not appear to be a messages import source',
  )
}

export type NormalizedMessagesImportSource = ReturnType<
  typeof normalizeMessagesImportSource
>
