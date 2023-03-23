import type { ParserOptions } from '@formatjs/icu-messageformat-parser/parser.js'

/** Represents a special key that provides defaults for all of the messages. */
export const AnyMessage = Symbol('defaultParserOptions')

/** Represents a context for resolution. */
export interface ResolutionContext {
  /** ID of the file. */
  readonly moduleId: string

  /** Compiled messages map. */
  readonly messages: Record<string, string>

  /** Returns options provided by the default resolver. */
  getDefaultOptions(): ParserOptions | undefined
}

/**
 * Represents a custom options resolving function.
 *
 * The function is called with `this` set to a {@link ResolutionContext} object.
 *
 * @example
 *   const skipParsingTags = function () {
 *     return {
 *       ...this.getDefaultOptions(),
 *       tags: false,
 *     }
 *   }
 *
 * @param messageId Identifier of the message for which the resolver is called.
 * @returns Options to use, `undefined` (nothing also counts as `undefined`) to
 *   use default options, `null` to not use any parsing options.
 * @this {ResolutionContext} A resolver context.
 */
export type ParserOptionsResolvingFunction = (
  this: ResolutionContext,
  messageId: string,
) => ParserOptions | null | undefined | void

/**
 * Represents an object where each key is a message ID and the value is either
 * options for the provided message or a function that resolves the options
 * dynamically.
 *
 * Options or options resolver under the key {@link AnyMessage} are used for all
 * messages to provide the default options.
 */
type MessagesParserOptionsMap = {
  [K in string | typeof AnyMessage]?:
    | ParserOptions
    | ParserOptionsResolvingFunction
}

/**
 * Represents an object containing options for different messages (using their
 * ID as a property name) or defaults for all messages under the key
 * {@link AnyMessage}. It can also be a function that resolves the options based
 * on the input arguments and resolution context object provided through `this`,
 * equivalent to the map with only {@link AnyMessage} key.
 */
export type MessagesParserOptionsValue =
  | MessagesParserOptionsMap
  | ParserOptionsResolvingFunction

/**
 * Represents a function that resolves the options for a message in a specific
 * module based on the provided {@link MessagesParserOptionsValue}.
 *
 * @param moduleId The ID of the module in which the message is located.
 * @param messageId The ID of the message.
 * @returns The options to use for the message or `undefined` if no options can
 *   be resolved.
 */
export type ParserOptionsResolver = (
  moduleId: string,
  messageId: string,
  messages: Record<string, string>,
) => ParserOptions | undefined

/**
 * Resolves the options for a message in a specific module using the provided
 * resolver and arguments that are provided to the resolver using the context.
 *
 * @param resolver The resolver function to use for resolving.
 * @param resolverArgs The arguments to pass to the resolver.
 * @returns The options to use for the message or `undefined` if no options can
 *   be resolved.
 */
function resolveOptionsWithResolver(
  resolver: ParserOptions | ParserOptionsResolvingFunction | undefined,
  ...resolverArgs:
    | Parameters<ParserOptionsResolver>
    | [
        ...Parameters<ParserOptionsResolver>,
        ParserOptionsResolvingFunction | undefined,
      ]
): ParserOptions | undefined {
  const [moduleId, messageId, messages, defaultResolver] = resolverArgs

  let cachedDefaultOptions: { value: ParserOptions | undefined } | undefined

  function getDefaultOptions() {
    if (defaultResolver == null) return undefined

    if (cachedDefaultOptions == null) {
      cachedDefaultOptions = {
        value: resolveOptionsWithResolver(
          defaultResolver,
          moduleId,
          messageId,
          messages,
        ),
      }
    }

    return cachedDefaultOptions.value
  }

  if (resolver == null) return getDefaultOptions()

  if (typeof resolver === 'function') {
    const options = resolver.call(
      {
        get moduleId() {
          return moduleId
        },
        get messages() {
          return messages
        },
        getDefaultOptions,
      },
      messageId,
    )

    return options === null ? undefined : options ?? getDefaultOptions()
  }

  return resolver
}

/**
 * Creates a function to resolve options based on the provide parser options for
 * messages or a function that resolves the options based on the input arguments
 * and resolution context object provided through `this`.
 *
 * @param options Input options or resolving function.
 * @param defaultResolver The function to use for resolving the default options.
 * @returns A function that resolves the options for a message or `undefined` if
 *   no options can be resolved.
 */
export function createOptionsResolver(
  options?: MessagesParserOptionsValue,
  defaultResolver?: ParserOptionsResolvingFunction,
): ParserOptionsResolver {
  if (options == null) {
    return function callDefaultResolver(moduleId, messageId, messages) {
      return resolveOptionsWithResolver(
        defaultResolver,
        moduleId,
        messageId,
        messages,
      )
    }
  }

  if (typeof options === 'function') {
    return function callRootResolver(moduleId, messageId, messages) {
      return resolveOptionsWithResolver(
        options,
        moduleId,
        messageId,
        messages,
        defaultResolver,
      )
    }
  }

  const normalizedOptions = new Map<
    string | typeof AnyMessage,
    ParserOptions | ParserOptionsResolvingFunction
  >()

  const globalOptionsResolver: ParserOptionsResolvingFunction =
    function resolveGlobalOptions(messageId) {
      return resolveOptionsWithResolver(
        normalizedOptions.get(AnyMessage),
        this.moduleId,
        messageId,
        this.messages,
        defaultResolver,
      )
    }

  if (options[AnyMessage] != null) {
    normalizedOptions.set(AnyMessage, options[AnyMessage])
  }

  for (const [messageId, parserOptions] of Object.entries(options)) {
    if (parserOptions != null) normalizedOptions.set(messageId, parserOptions)
  }

  return function resolve(moduleId, messageId, messages) {
    return resolveOptionsWithResolver(
      normalizedOptions.get(messageId),
      moduleId,
      messageId,
      messages,
      globalOptionsResolver,
    )
  }
}
