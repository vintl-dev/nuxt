import type { CompileFn } from '@formatjs/cli-lib'
import type { FilterPattern } from '@rollup/pluginutils'
import type { MessagesParserOptionsValue } from '../parser/options.js'
import {
  normalizeWrappingOptions,
  type WrappablePlugin,
  type WrappingOptions,
} from '../wrapping/index.js'
import type { MessagesASTMap } from './types.js'

/** Represents options for the transformation output. */
interface OutputOptions {
  /**
   * Defines the format of the output file or provides a function that will
   * encode input JavaScript object containing the messages into a string
   * representing contents of the transformed file.
   *
   * The following formats are supported:
   *
   * - `module`, which outputs an ESM JavaScript module.
   * - `json`, which outputs a JSON string, that can be processed by other
   *   plugins.
   *
   * @default 'module' // The output is an ESM module.
   */
  format?: 'module' | 'json' | ((messages: MessagesASTMap) => string)

  /**
   * Defines what kind of output should be generated.
   *
   * The following output types are supported:
   *
   * - `raw` - outputs the messages as is.
   * - `ast` - pre-parses the messages and outputs their AST.
   *
   * @default 'ast' // The output is an AST.
   */
  type?: 'raw' | 'ast'
}

/** Represents options for the plugin. */
export interface Options<PluginType extends WrappablePlugin> {
  /**
   * Defines a string or regular expression, or an array of those, that should
   * match with the file ID in order for it to be transformed.
   *
   * @default '** /*.messages.json' // Match any JSON files by default.
   */
  include?: FilterPattern

  /**
   * Defines either a single glob string or regular expression, or an array of
   * those, specifying which file IDs should NOT be transformed.
   *
   * @default undefined No exclusions are applied by default.
   */
  exclude?: FilterPattern

  /**
   * Custom filter function that checks whether the file must be transformed by
   * the plugin.
   *
   * If both filtering options (`include`/`exclude`) and `filter` are provided,
   * then `filter` takes the priority and will be called first. If it returns a
   * null-y value, then filter based on filtering options will be used.
   *
   * @param id ID of the file.
   * @returns Either a boolean value indicating inclusion of the file into
   *   transformation or null-y value (`null`/`undefined`) to use filtering
   *   options.
   */
  filter?(id: string): boolean | null | undefined | void

  /**
   * Indentation used in the output file. Either a string or a number of spaces.
   *
   * @default '\t' // Single tab.
   */
  indent?: string | number

  /**
   * Either a name of the built-in formatter or function that accepts JSON
   * object from the file and produces a record of messages keyed by their IDs.
   *
   * @default 'default'
   */
  format?: CompileFn | string

  /**
   * This function accepts file contents and parses it to a JavaScript value
   * that will be passed to the {@link format} function (or resolved built-in
   * formatter).
   *
   * It can be helpful when you're not using standard JSON, but instead using
   * something like JSON5, YAML, or TOML. Other plugins that process files of
   * these formats must be configured to exclude files that should be
   * transformed by this plugin; otherwise, the provided `code` will be raw
   * JavaScript.
   *
   * @default (code) => JSON.parse(code)
   * @param {string} code - The raw contents of the file that need to be parsed.
   * @param {string} id - The ID of the file.
   * @returns {Object} The result of parsing the code.
   */
  parse?(code: string, id: string): void

  /**
   * An object whose keys are message IDs and whose values are either parsing
   * options for those messages or a resolver function that generates parsing
   * options based on contextual information (such as module ID, message ID, and
   * all messages).
   *
   * By default only `locale` is deducted using the file name:
   *
   * ```js
   * function localeFromModuleId() {
   *   return {
   *     locale: new Intl.Locale(
   *       pathe.basename(this.moduleId).split('.')[0],
   *     ),
   *   }
   * }
   * ```
   *
   * @default localeFromModuleId
   */
  parserOptions?: MessagesParserOptionsValue

  /**
   * Plugins wrapping enables additional hooks in compatible bundlers to prevent
   * other plugins from transforming files that would be transformed by this
   * plugin.
   *
   * Currently, it only works with Rollup and Vite. For Webpack, the
   * configuration is automatically extended regardless of this option,
   * preventing its pre-loading of the file as any other format than raw text.
   *
   * It should generally be safe, but since it modifies other plugins, which can
   * be risky, it must be explicitly enabled. It is generally recommended to
   * configure other plugins manually to ignore files that are transformed by
   * this plugin.
   *
   * This option accepts either a boolean that toggles the state of plugins
   * wrapping, or an object that configures plugins wrapping in depth.
   *
   * @default false // Plugins wrapping is disabled.
   */
  pluginsWrapping?: boolean | WrappingOptions<PluginType>

  /** Options that allow to configure the output of transformation. */
  output?: OutputOptions
}

function normalizeIndent(indent?: Options<any>['indent']) {
  if (indent == null) return '\t'
  return typeof indent === 'number' ? ' '.repeat(indent) : indent
}

function normalizeWrappingOptions_<PluginType extends WrappablePlugin>(
  options?: Options<PluginType>['pluginsWrapping'],
) {
  return normalizeWrappingOptions(
    typeof options === 'boolean' ? { use: options } : options,
  )
}

function normalizeOutputOptions(options?: OutputOptions) {
  return {
    ...options,
    format: options?.format ?? 'module',
    type: options?.type ?? 'ast',
  } satisfies OutputOptions
}

export function normalizeOptions<PluginType extends WrappablePlugin>(
  options?: Options<PluginType>,
) {
  return {
    ...options,
    include: options?.include ?? '**/*.messages.json',
    indent: normalizeIndent(options?.indent),
    format: options?.format ?? 'default',
    parse: options?.parse ?? ((code) => JSON.parse(code)),
    pluginsWrapping: normalizeWrappingOptions_(
      options?.pluginsWrapping ?? false,
    ),
    output: normalizeOutputOptions(options?.output),
  } satisfies Options<PluginType>
}

/** Represents the options after normalization using {@link normalizeOptions}. */
export type NormalizedOptions<PluginType extends WrappablePlugin> = ReturnType<
  typeof normalizeOptions<PluginType>
>
