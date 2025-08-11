import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser'

/** Represents a record of raw messages. */
export type MessagesMap = Record<string, string>

/** Represents a record of parsed messages. */
export type MessagesASTMap = Record<string, MessageFormatElement[]>
