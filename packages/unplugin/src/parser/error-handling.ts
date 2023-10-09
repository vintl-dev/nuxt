import {
  type MessageFormatElement,
  createLiteralElement,
  type ParserOptions,
} from '@formatjs/icu-messageformat-parser'

export type ParseErrorHandlerResult = MessageFormatElement[] | undefined | void

/**
 * A function that handles parsing error and either throws another error, or
 * returns a fallback string or parse result.
 *
 * @param context Context containing the error, message ID and other relevant
 *   properties.
 * @returns The fallback value or nothing.
 */
export type ParseErrorHandler = (
  context: ParseErrorContext,
) => ParseErrorHandlerResult

export const builtinStrategies = {
  /** @returns The original message as a literal. */
  'use-message-as-literal'(ctx) {
    return [createLiteralElement(ctx.message)]
  },
  /** @returns The message ID as a literal. */
  'use-id-as-literal'(ctx) {
    return [createLiteralElement(ctx.messageId)]
  },
  /** @returns Empty literal. */
  'use-empty-literal'() {
    return [createLiteralElement('')]
  },
  /** @returns `undefined`, which skips the string. */
  skip() {
    return undefined
  },
} satisfies Record<string, ParseErrorHandler>

Object.setPrototypeOf(builtinStrategies, null)

export type ParseErrorHandlingStrategy = keyof typeof builtinStrategies

export type ParseErrorHandlingOption =
  | ParseErrorHandler
  | ParseErrorHandlingStrategy

/**
 * Resolve error handler function.
 *
 * @param option Either an error handler to return back or the name of the
 *   built-in handling strategy.
 * @returns Resolved error handler.
 * @throws {Error} If called with unknown built-in handling strategy name.
 */
export function resolveParseErrorHandler(option: ParseErrorHandlingOption) {
  if (typeof option === 'function') return option

  if (Object.hasOwn(builtinStrategies, option)) return builtinStrategies[option]

  throw new Error(`Cannot resolve built-in strategy with name "${option}"`)
}

export interface ParseErrorContext {
  /** ID of the module that is being parsed. */
  get moduleId(): string

  /** ID of the message that cannot be parsed. */
  get messageId(): string

  /** Message that cannot be parsed. */
  get message(): string

  /** Error that occurred during the parsing. */
  get error(): unknown

  /** Parser options that were used to parse the message. */
  get parserOptions(): ParserOptions | undefined

  /**
   * Call one of the built-in error handling strategies.
   *
   * @param name Name of the error handling strategy.
   * @returns Result for the strategy.
   */
  useBuiltinStrategy(name: ParseErrorHandlingStrategy): ParseErrorHandlerResult
}

/**
 * Creates a new context.
 *
 * @param info Information required to create a context.
 * @returns Newly created context object.
 */
export function createParseErrorContext(
  info: Pick<
    ParseErrorContext,
    'error' | 'moduleId' | 'message' | 'messageId' | 'parserOptions'
  >,
) {
  const ctx = {
    ...info,
    useBuiltinStrategy(name: ParseErrorHandlingStrategy) {
      return resolveParseErrorHandler(name)(ctx)
    },
  }

  return Object.freeze(ctx) satisfies ParseErrorContext
}
