export { normalizeOptions as normalizeWrappingOptions } from './options.js'
export type { Options as WrappingOptions } from './options.js'
export type { WrappablePlugin } from './types.js'
export {
  rollup as rollupWrappingPartial,
  vite as viteWrappingPartial,
} from './plugin.js'
export { isSupportedLoader as supportsWrapping } from './utils.js'
