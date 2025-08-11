import { BaseError } from '../shared/error-proto.ts'
import type { FilterFunction, WarningFunction } from '../shared/types.ts'
import { PluginIneffectiveError } from './errors.ts'
import type { NormalizedOptions } from './options.ts'
import { WrappingFunctionSelector } from './resolver.ts'
import type { WrappablePlugin } from './types.ts'

export function wrapPlugins<PluginType extends WrappablePlugin>(
  plugins: readonly PluginType[],
  options: NormalizedOptions<PluginType>,
  filter: FilterFunction,
  onWarn: WarningFunction,
) {
  if (!options.use) {
    throw new BaseError(
      'Wrapping is not enabled, however `wrapPlugins` was called. This is a bug, please report it',
    )
  }

  if (plugins == null || (Array.isArray(plugins) && plugins.length === 0)) {
    onWarn(
      new PluginIneffectiveError(
        'Your bundler configuration does not include any plugins',
      ),
    )

    return
  }

  const { select: selectWrappingFunc } = new WrappingFunctionSelector(
    options?.wrappers,
    options?.extendDefaults,
    onWarn,
  )

  for (const plugin of plugins) {
    const wrappingFunc = selectWrappingFunc(plugin.name)

    if (wrappingFunc != null) wrappingFunc(plugin, filter)
  }
}
