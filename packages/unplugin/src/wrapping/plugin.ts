import type { PluginContext } from 'rollup'
import type { RollupPlugin, VitePlugin } from 'unplugin'
import type { FilterFunction } from '../shared/types.js'
import type { NormalizedOptions } from './options.js'
import { wrapPlugins } from './wrapper.js'

/**
 * Provides Vite plugin hooks for implementing plugins wrapping based on the
 * specified options and filter function.
 *
 * @param options Options for wrapping plugins.
 * @param filter A function that matches all files transformed by the main
 *   plugin.
 * @returns A set of Vite plugin hooks that can be used or extended to enable
 *   plugins wrapping.
 */
export function vite(
  options: NormalizedOptions<VitePlugin>,
  filter: FilterFunction,
) {
  return (
    options.use
      ? {
          configResolved(config) {
            wrapPlugins(config.plugins, options, filter, (warning) => {
              // eslint-disable-next-line no-console
              console.warn(String(warning))
            })
          },
        }
      : {}
  ) satisfies Omit<VitePlugin, 'name'>
}

/**
 * Provides Rollup plugin hooks for implementing plugins wrapping based on the
 * specified options and filter function.
 *
 * @param options Options for wrapping plugins.
 * @param filter A function that matches all files transformed by the main
 *   plugin.
 * @returns A set of Rollup plugin hooks that can be used or extended to enable
 *   plugins wrapping.
 */
export function rollup(
  options: NormalizedOptions<RollupPlugin>,
  filter: FilterFunction,
) {
  return (
    options.use
      ? {
          buildStart(
            this: Partial<Pick<PluginContext, 'warn'>>,
            rollupOptions,
          ) {
            wrapPlugins(
              rollupOptions.plugins,
              options,
              filter,
              // eslint-disable-next-line no-console
              this?.warn ?? ((warn) => console.warn(warn)),
            )
          },
        }
      : {}
  ) satisfies Omit<RollupPlugin, 'name'>
}
