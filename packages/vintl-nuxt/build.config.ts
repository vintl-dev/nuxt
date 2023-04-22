import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  hooks: {
    'build:before'(ctx) {
      for (const entry of ctx.options.entries) {
        if (
          entry.builder === 'mkdist' &&
          'ext' in entry &&
          entry.input.endsWith('vintl-nuxt/src/runtime')
        ) {
          entry.ext = 'js'
        }
      }
    },
  },
})
