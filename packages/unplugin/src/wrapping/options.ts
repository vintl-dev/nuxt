import type { FilterFunction } from '../shared/types.js'
import type { WrappablePlugin } from './types.js'

/**
 * A function that accepts plugin and filter function as inputs and mutates the
 * plugin hooks to use the provided filter function, which would return `true`
 * for modules that would should be processed by the ICU Messages plugin.
 *
 * @param plugin The plugin to wrap.
 * @param filter The filter function to use.
 */
export type WrappingFunction<PluginType> = (
  plugin: PluginType,
  filter: FilterFunction,
) => void

/**
 * Represents a map of wrappers, which is an object where each key is a plugin
 * name and the value is a wrapping function.
 */
export type WrappingFunctionsMap<PluginType> = Record<
  string,
  WrappingFunction<PluginType> | undefined
>

/** Represents options for plugin wrapping. */
export interface Options<PluginType extends WrappablePlugin> {
  /**
   * Whether to enable the plugin wrapping.
   *
   * @default false // Plugins wrapping is disabled.
   */
  use?: boolean

  /**
   * Whether to extend the defaults with provided `wrappers` or overwrite them.
   *
   * @default true // `wrappers` extends the defaults.
   */
  extendDefaults?: boolean

  /**
   * A map of wrapping functions that can be used to modify the behavior of
   * plugins. The map is an object where each key is a plugin name and the value
   * is a function that accepts a plugin object and a filter function, and
   * mutates the plugin hooks to use the provided filter function.
   *
   * @example
   *   // WARNING: THIS EXAMPLE DOES NOT ACCOUNT FOR OBJECT HOOKS!
   *
   *   ;({
   *     'my-json-plugin'(plugin, filter) {
   *       const originalTransform = plugin.transform
   *       plugin.transform = function (id, code) {
   *         if (filter(id)) return
   *         return originalTransform.call(this, id, code)
   *       }
   *     },
   *   })
   */
  wrappers?: WrappingFunctionsMap<PluginType>
}

export function normalizeOptions<PluginType extends WrappablePlugin>(
  options?: Options<PluginType>,
) {
  return {
    ...options,
    use: options?.use ?? false,
    extendDefaults: options?.extendDefaults ?? true,
  } satisfies Options<PluginType>
}

export type NormalizedOptions<PluginType extends WrappablePlugin> = ReturnType<
  typeof normalizeOptions<PluginType>
>
