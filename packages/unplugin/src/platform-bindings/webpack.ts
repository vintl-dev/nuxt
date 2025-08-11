import { plugin as basePlugin, type Options } from '../plugin/index.ts'

export * from '../secondary-exports.ts'

export type PluginOptions = Options<never>

export const icuMessages = basePlugin.webpack
