import type { Plugin, TransformHook } from 'rollup'
import type { FilterFunction } from '../shared/types.js'

/**
 * A default wrapping function for Rollup-based plugins, which wraps the
 * `transform` hook, preventing it from operating on the modules that are
 * matched by the provided filter function.
 *
 * @param plugin The plugin, which `transform` hook should be wrapped.
 * @param filter A filter function.
 */
export function wrapTransform(
  plugin: Pick<Plugin, 'transform'>,
  filter: FilterFunction,
) {
  const originalTransform = plugin.transform

  if (originalTransform != null) {
    if (typeof originalTransform === 'object') {
      const handler = originalTransform.handler

      plugin.transform = {
        ...originalTransform,
        handler(code, id) {
          if (filter(id)) return null as ReturnType<TransformHook>

          return handler.call(this, id, code) as ReturnType<TransformHook>
        },
      }
    } else {
      plugin.transform = function wrappedTransform(code, id) {
        if (filter(id)) return null

        return originalTransform.call(this, code, id)
      }
    }
  }
}
