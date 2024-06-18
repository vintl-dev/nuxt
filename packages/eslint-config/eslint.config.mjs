import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import overrides from './overrides.mjs'

export default createConfigForNuxt().append(overrides)
