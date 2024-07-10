// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import overrides from '@vintl-dev/eslint-config-peony/overrides'

export default createConfigForNuxt({
  features: { tooling: true },
}).append(overrides)
