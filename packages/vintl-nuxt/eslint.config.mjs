// @ts-check

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '@vintl-dev/eslint-config-peony'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default config.append([
  {
    name: 'vintl/nuxt/module',
    files: ['./src/**/*.ts', './types/*.d.ts'],
    ignores: ['./src/runtime/**/*.ts', './dist'],
    languageOptions: {
      parserOptions: {
        project: resolve(__dirname, 'tsconfig.json'),
      },
    },
  },
  {
    name: 'vintl/nuxt/build',
    files: ['./build.config.ts'],
    languageOptions: {
      parserOptions: {
        project: resolve(__dirname, 'tsconfig.build.json'),
      },
    },
  },
  {
    name: 'vintl/nuxt/runtime',
    files: [
      './stubs/*.{d.ts,js}',
      './src/runtime/**/*.{ts,mts}',
      './types/*.d.ts',
    ],
    languageOptions: {
      parserOptions: {
        project: resolve(__dirname, 'tsconfig.runtime.json'),
      },
    },
  },
])
