import type { UnpluginInstance, VitePlugin } from 'unplugin'
import { plugin as basePlugin, type Options } from '../plugin/index.js'

export * from '../secondary-exports.js'
export const icuMessages = (
  basePlugin as UnpluginInstance<Options<VitePlugin>, false>
).vite
