import type { CompileFn } from '@formatjs/cli-lib'
import { BaseError } from '../shared/error-proto.js'
import type { MessagesMap } from './types.js'

/** An error that is thrown whenever there's an error compiling the messages. */
class CompilationError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_MESSAGE_COMPILATION_ERROR'
}

/**
 * A function that takes a function to compile the messages, input value that is
 * being compiled. It then calls the compile function and validates its output.
 *
 * @param compileFc A function that compiles the messages from the input value.
 * @param inputValue The input value that is being compiled.
 * @returns The output value of the compiled function.
 * @throws {@link CompilationError} If the compilation fails or the output is
 *   invalid.
 */
export function compileMessages(compileFc: CompileFn, inputValue: any) {
  let messages: MessagesMap

  try {
    messages = compileFc(inputValue)
  } catch (cause) {
    throw new CompilationError(
      'Cannot compile the messages using the provided formatter function',
      { cause },
    )
  }

  if (messages == null || typeof messages !== 'object') {
    throw new CompilationError(
      'Value returned by the formatter function is not an object',
    )
  }

  return Object.assign(Object.create(null), messages)
}
