import {
  type Configuration as WebpackConfiguration,
  // eslint-disable-next-line import/no-named-default
  default as webpack,
  type StatsCompilation,
} from 'webpack'
import { describe, it, expect } from 'vitest'
import { createFsFromVolume, Volume } from 'memfs'
import type * as _distWebpack from '../dist/webpack'
import { createResolver } from './utils/resolver'

Error.stackTraceLimit = 1000

const { icuMessages }: typeof _distWebpack = await import(
  '../dist/webpa' + 'ck.cjs' // because unbuild emits .d.ts, but .(c|m)js files
)

const resolve = createResolver(import.meta.url)

class WebpackCompilationError extends Error {
  constructor(public causes?: unknown[]) {
    super('Compilation failed')
  }
}

async function buildFile(
  entry: string,
  extendConfig?: (config: WebpackConfiguration) => void | Promise<void>,
) {
  const config: WebpackConfiguration = {
    entry: resolve(entry),
    mode: 'production',
    output: {
      library: { type: 'module' },
      filename: 'index.mjs',
      path: '/dist',
    },
    experiments: { outputModule: true },
    optimization: { minimize: false },
  }

  await extendConfig?.(config)

  const compiler = webpack(config)

  const memfs = createFsFromVolume(new Volume())

  compiler.outputFileSystem = memfs

  await new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let resolution: StatsCompilation | undefined
      let rejection: WebpackCompilationError | undefined

      if (err != null) {
        rejection = new WebpackCompilationError([err])
      } else if (stats != null) {
        const info: StatsCompilation = stats.toJson()

        const hasWarnings = stats.hasWarnings()
        const hasErrors = stats.hasErrors()

        if (hasErrors || hasWarnings) {
          if (hasWarnings) {
            console.warn('[webpack] [warn]', info.warnings)
          }

          rejection = new WebpackCompilationError(info.errors)
        } else {
          resolution = stats
        }
      }

      compiler.close((closeErr) => {
        if (closeErr != null) {
          if (rejection == null) {
            rejection = new WebpackCompilationError([closeErr])
          } else {
            ;(rejection.causes ??= []).push(closeErr)
          }
        }

        if (rejection != null) {
          reject(rejection)
          return
        }

        resolve(resolution!)
      })
    })
  })

  return memfs.readFileSync('/dist/index.mjs', { encoding: 'utf-8' })
}

describe(
  'webpack',
  () => {
    it('should generate bundle', async () => {
      const out = await buildFile('fixtures/normal/input.mjs', (config) => {
        ;(config.plugins ??= []).push(
          icuMessages({
            include: '**/*.messages.json',
            format: 'crowdin',
          }),
        )
      })

      expect(out).toMatchSnapshot()
    })

    it('should fail with unresolved formatter', async () => {
      let err: unknown
      try {
        await buildFile('fixtures/normal/input.mjs', (config) => {
          ;(config.plugins ??= []).push(
            icuMessages({
              include: '**/*.messages.json',
              format: 'non-existent',
            }),
          )
        })
      } catch (err_) {
        err = err_
      }

      expect(err).toBeDefined()
    })

    it('should be compatible with other json files', async () => {
      const out = await buildFile('fixtures/with-json/input.mjs', (config) => {
        ;(config.plugins ??= []).push(
          icuMessages({
            include: '**/*.messages.json',
            format: 'crowdin',
          }),
        )
      })

      expect(out).toMatchSnapshot()
    })

    it('should be able to parse using TOML files', async () => {
      const out = await buildFile('fixtures/toml/input.mjs', async (config) => {
        ;(config.plugins ??= []).push(
          icuMessages({
            include: '**/*.messages.toml',
            format: 'crowdin',
            parse: await import('@ltd/j-toml').then(
              (_) => (code: string) => _.parse(code),
            ),
          }),
        )
      })

      expect(out).toMatchSnapshot()
    })

    it('should transform to AST JSON', async () => {
      const out = await buildFile('fixtures/normal/input.mjs', (config) => {
        ;(config.plugins ??= []).push(
          icuMessages({
            include: '**/*.messages.json',
            format: 'crowdin',
            output: {
              format: 'json',
            },
          }),
        )
      })

      expect(out).toMatchSnapshot()
    })

    it('should transform to JSON of raw messages', async () => {
      const out = await buildFile('fixtures/normal/input.mjs', (config) => {
        ;(config.plugins ??= []).push(
          icuMessages({
            include: '**/*.messages.json',
            format: 'crowdin',
            output: {
              type: 'raw',
              format: 'json',
            },
          }),
        )
      })

      expect(out).toMatchSnapshot()
    })
  },
  { timeout: 60_000 },
)
