import type { UnpluginInstance, RollupPlugin } from 'unplugin'
import { plugin as basePlugin, type Options } from '../plugin/index.ts'

export * from '../secondary-exports.ts'
export const icuMessages = (
  basePlugin as UnpluginInstance<Options<RollupPlugin>, false>
).rollup
