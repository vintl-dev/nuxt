import {
  type MessageFormatElement,
  parse as parseMessage,
} from '@formatjs/icu-messageformat-parser'
import {
  type ParserOptionsResolver,
  createParseErrorContext,
  type ParseErrorHandler,
} from '../parser/index.ts'
import { BaseError, type BaseErrorOptions } from '../shared/error-proto.ts'
import type { MessagesMap } from './types.ts'

/**
 * An error that is thrown whenever there's an error with parsing the raw
 * message.
 */
class ParseError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_PARSING_ERROR'
}

class ParseOptionsResolutionError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_PARSE_OPTS_RES_ERROR'
}

class ErrorHandlerError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_ERROR_HANDLER_ERROR'

  /** The original parsing error which has been suppressed by this error. */
  public readonly suppressed: unknown

  public constructor(
    message?: string,
    options?: BaseErrorOptions & { suppressed?: unknown },
  ) {
    super(
      message,
      (() => {
        if (options == null) return options

        return Object.fromEntries(
          Object.entries(options).filter(
            ([propertyName]) => propertyName !== 'suppressed',
          ),
        )
      })(),
    )

    this.suppressed = options?.suppressed
  }

  public get stack() {
    return this.suppressed == null
      ? super.stack
      : `${super.stack}\n\n  Suppressed: ${String(this.suppressed)}`
  }
}

/**
 * Takes in a record of raw messages, parses each of the keys, querying the
 * parsing options using the provided resolver, and returns a record where each
 * message is parsed to an AST.
 *
 * @param messages A record of raw messages.
 * @param getParserOptions A function that returns the parser options for the
 *   given message.
 * @param moduleId The module ID of the messages file.
 * @returns A record of parsed messages.
 * @throws {@link ParseError} If the parsing fails.
 */
export function parseMessages(
  messages: MessagesMap,
  moduleId: string,
  getParserOptions: ParserOptionsResolver,
  onError?: ParseErrorHandler,
) {
  const out: Record<string, MessageFormatElement[]> = Object.create(null)

  for (const [messageId, message] of Object.entries(messages)) {
    if (typeof message !== 'string') {
      throw new ParseError(`Value under key "${messageId}" is not a string`)
    }

    function throwWithCause(cause: unknown): never {
      throw new ParseError(`Cannot parse message under key "${messageId}"`, {
        cause,
      })
    }

    let parserOptions
    try {
      parserOptions = getParserOptions(moduleId, messageId, messages)
    } catch (cause) {
      throwWithCause(
        new ParseOptionsResolutionError(
          'Failed to resolve options for the message',
          { cause },
        ),
      )
    }

    try {
      out[messageId] = parseMessage(message, parserOptions)
    } catch (error) {
      if (onError == null) throwWithCause(error)

      try {
        const fallback = onError(
          createParseErrorContext({
            error,
            moduleId,
            message,
            messageId,
            parserOptions,
          }),
        )

        if (fallback != null) out[messageId] = fallback
      } catch (cause) {
        throwWithCause(
          new ErrorHandlerError('Calling error handler thrown an error', {
            cause,
            suppressed: error,
          }),
        )
      }
    }
  }

  return out
}
