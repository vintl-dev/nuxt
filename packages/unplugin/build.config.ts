import { defineBuildConfig } from 'unbuild'

/*
exports
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./webpack": {
      "types": "./dist/platform-bindings/webpack.d.ts",
      "import": "./dist/platform-bindings/webpack.mjs",
      "require": "./dist/platform-bindings/webpack.cjs"
    },
    "./vite": {
      "types": "./dist/platform-bindings/vite.d.ts",
      "import": "./dist/platform-bindings/vite.mjs",
      "require": "./dist/platform-bindings/vite.cjs"
    },
    "./rollup": {
      "types": "./dist/platform-bindings/rollup.d.ts",
      "import": "./dist/platform-bindings/rollup.mjs",
      "require": "./dist/platform-bindings/rollup.cjs"
    }
*/

export default defineBuildConfig({
  entries: [
    {
      builder: 'rollup',
      input: './src/index',
      name: 'index',
      outDir: './dist',
      declaration: true,
    },
    {
      builder: 'rollup',
      input: './src/platform-bindings/webpack',
      name: 'webpack',
      outDir: './dist',
      declaration: true,
    },
    {
      builder: 'rollup',
      input: './src/platform-bindings/vite',
      name: 'vite',
      outDir: './dist',
      declaration: true,
    },
    {
      builder: 'rollup',
      input: './src/platform-bindings/rollup',
      name: 'rollup',
      outDir: './dist',
      declaration: true,
    },
  ],
  hooks: {
    'build:before'(ctx) {
      ctx.options.declaration = ctx.options.entries.some((_) => _.declaration)
    },
  },
  rollup: {
    emitCJS: true,
  },
})
