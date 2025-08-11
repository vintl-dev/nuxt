import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter as createRollupFilter } from '@rollup/pluginutils'

/** Options for filtering file IDs. */
export interface FilterOptions {
  /**
   * An optional filter pattern or array of patterns that specifies which file
   * IDs should be included.
   */
  include?: FilterPattern

  /**
   * An optional filter pattern or array of patterns that specifies which file
   * IDs should be excluded.
   */
  exclude?: FilterPattern

  /**
   * An optional custom filter function that is called for each file ID. If this
   * function returns a boolean value, it determines whether the file should be
   * included or excluded. If this function does not return anything or returns
   * `null` or `undefined`, the include and exclude patterns are used instead.
   *
   * @param id The ID of the file to filter.
   * @returns A boolean value indicating whether the file should be included or
   *   excluded, or `null`/`undefined` to defer to the include and exclude
   *   patterns.
   */
  filter?(id: string): boolean | null | undefined | void
}

/**
 * Creates a new filter function based on the specified options. If no options
 * specified, always returns `true`.
 *
 * @example
 *   const filter = createFilter({ include: /\.ts$/ })
 *   const files = ['index.ts', 'utils.js', 'app.tsx']
 *   files.filter((fileName) => filter(fileName))
 *   // => ['index.ts']
 *
 * @param options An optional set of filter options.
 * @returns A new filter function that filters file IDs according to the
 *   options.
 */
export function createFilter({ include, exclude, filter }: FilterOptions = {}) {
  const rollupFilter =
    include != null || exclude != null
      ? createRollupFilter(include, exclude)
      : null

  const defaultReturn = filter == null && rollupFilter == null

  return function isMatch(id: string) {
    return filter?.(id) ?? rollupFilter?.(id) ?? defaultReturn
  }
}
