import type { UnpluginInstance, RollupPlugin } from 'unplugin'
import { plugin as basePlugin, type Options } from '../plugin/index.js'

export * from '../secondary-exports.js'
export const icuMessages = (
  basePlugin as UnpluginInstance<Options<RollupPlugin>, false>
).rollup
