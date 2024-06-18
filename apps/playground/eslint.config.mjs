// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import peonyOverrides from '@vintl-dev/eslint-config-peony/overrides'

export default withNuxt().append(peonyOverrides)
