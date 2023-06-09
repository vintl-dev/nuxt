import type { UnpluginInstance, VitePlugin } from 'unplugin'
import { plugin as basePlugin, type Options } from '../plugin/index.ts'

export * from '../secondary-exports.ts'
export const icuMessages = (
  basePlugin as UnpluginInstance<Options<VitePlugin>, false>
).vite
