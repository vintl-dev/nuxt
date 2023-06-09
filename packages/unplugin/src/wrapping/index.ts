export { normalizeOptions as normalizeWrappingOptions } from './options.ts'
export type { Options as WrappingOptions } from './options.ts'
export type { WrappablePlugin } from './types.ts'
export {
  rollup as rollupWrappingPartial,
  vite as viteWrappingPartial,
} from './plugin.ts'
export { isSupportedLoader as supportsWrapping } from './utils.ts'
