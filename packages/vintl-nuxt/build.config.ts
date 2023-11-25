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

      ctx.options.entries.push({
        builder: 'rollup',
        name: 'options',
        input: './src/options/index.ts',
        declaration: 'compatible',
        outDir: './dist',
      })
    },
  },
})
