import {
  type MessageFormatElement,
  parse as parseMessage,
} from '@formatjs/icu-messageformat-parser'
import type { ParserOptionsResolver } from '../parser/options.ts'
import { BaseError } from '../shared/error-proto.ts'
import type { MessagesMap } from './types.ts'

/**
 * An error that is thrown whenever there's an error with parsing the raw
 * message.
 */
class ParseError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_PARSING_ERROR'
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
  getParserOptions: ParserOptionsResolver,
  moduleId: string,
) {
  const out: Record<string, MessageFormatElement[]> = Object.create(null)

  for (const [key, message] of Object.entries(messages)) {
    if (typeof message !== 'string') {
      throw new ParseError(`Value under key "${key}" is not a string`)
    }

    try {
      out[key] = parseMessage(
        message,
        getParserOptions(moduleId, key, messages),
      )
    } catch (cause) {
      throw new ParseError(`Cannot parse message under key "${key}"`, { cause })
    }
  }

  return out
}
