import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  hooks: {
    'build:before'(ctx) {
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
