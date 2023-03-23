import { BaseError } from '../shared/error-proto.js'

/**
 * A error emitted as a warning to note about ineffectiveness of the plugin in
 * specific configurations.
 */
export class PluginIneffectiveError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_WRAP_USELESS'
}
