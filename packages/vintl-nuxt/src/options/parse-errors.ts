import type { ParseErrorHandlingOption as RegularParseErrorHandlingOption } from '@vintl/unplugin'

export type ParseErrorHandlingOption =
  | RegularParseErrorHandlingOption
  | 'log-and-skip'

export function isParseErrorHandlingOption(
  input: unknown,
): input is ParseErrorHandlingOption {
  return (
    typeof input === 'function' ||
    input === 'use-message-as-literal' ||
    input === 'use-id-as-literal' ||
    input === 'use-empty-literal' ||
    input === 'skip' ||
    input === 'log-and-skip'
  )
}
