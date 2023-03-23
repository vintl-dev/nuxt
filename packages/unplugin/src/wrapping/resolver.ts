import type { WarningFunction } from '../shared/types.js'
import { isEmptyObject } from '../utils/object.js'
import type { WrappingFunctionsMap } from './options.js'
import { wrapTransform } from './default-wrapper.js'
import { PluginIneffectiveError } from './errors.js'

/**
 * A class that holds a map of wrapping functions and exposes a function that
 * can be used to select a single function based on the plugin name.
 */
export class WrappingFunctionSelector<
  PluginType,
  InheritsDefaults extends boolean,
> {
  private readonly wrappers: WrappingFunctionsMap<PluginType>

  /**
   * Constructs a new wrapping functions selector.
   *
   * @param wrappers A map of wrapping functions.
   * @param inheritDefaults Whether to inherit the default wrapping functions.
   * @param onWarn A function that is called when there's a warning.
   */
  constructor(
    wrappers?: WrappingFunctionsMap<PluginType>,
    inheritDefaults?: InheritsDefaults,
    onWarn?: WarningFunction,
  ) {
    const useDefaults = inheritDefaults ?? true

    if (!useDefaults && isEmptyObject(wrappers)) {
      onWarn?.(
        new PluginIneffectiveError(
          'Your configuration does not make use of defaults and does not provide any other wrappers. This transform wrap plugin will be ineffective and probably could be removed.',
        ),
      )
    }

    this.wrappers = {
      ...(useDefaults &&
        ({
          json: wrapTransform,
          'vite:json': wrapTransform,
        } as WrappingFunctionsMap<PluginType>)),
      ...wrappers,
    }
  }

  /**
   * A function that takes in a plugin name and returns a wrapping function for
   * that plugin, if there's any. If there's none, returns `undefined`.
   *
   * It is bound to the object and can be destructured to be used on its own.
   *
   * @param pluginName The plugin name.
   * @returns The wrapping function, or `undefined`.
   */
  public readonly select = (pluginName: string) => {
    return this.wrappers[pluginName]
  }
}
