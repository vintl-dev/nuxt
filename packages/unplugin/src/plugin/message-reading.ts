import { BaseError } from '../shared/error-proto.js'

/**
 * A function that is called to parse the message file contents.
 *
 * @param code Raw contents of the messages file.
 * @param moduleId Module ID of the messages file.
 * @returns Parsed messages file contents with uncompiled messages.
 */
export type ParseFunction = (code: string, moduleId: string) => any

/** An error that is thrown if there's an error with parsing the messages file. */
export class ReadoutError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_PARSING_ERROR'
}

/**
 * A function that takes in a messages file contents, as well as its module ID,
 * and returns an chunk of uncompiled messages.
 *
 * @param parse Function provided through options to parse the messages file
 *   contents.
 * @param code Raw contents of the messages file.
 * @param moduleId Module ID of the messages file.
 * @returns Parsed messages file contents with uncompiled messages.
 * @throws {@link ReadoutError} If there's an error with parsing the messages
 *   file.
 */
export function readMessagesFile(
  parse: ParseFunction,
  code: string,
  moduleId: string,
) {
  try {
    return parse(code, moduleId)
  } catch (cause) {
    throw new ReadoutError('Cannot read the messages file', { cause })
  }
}
