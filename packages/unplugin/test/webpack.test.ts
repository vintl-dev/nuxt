import {
  type Configuration as WebpackConfiguration,
  // eslint-disable-next-line import/no-named-default
  default as webpack,
  type StatsCompilation,
} from 'webpack'
import { describe, it, expect, vi } from 'vitest'
import { createFsFromVolume, Volume } from 'memfs'
import { createResolver } from './utils/resolver'
import { basename } from 'pathe'
import type { PluginOptions } from '../dist/webpack.cjs'

Error.stackTraceLimit = 1000

const { icuMessages } = await import('../dist/webpack.cjs')

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
    optimization: {
      minimize: false,
      moduleIds: 'named',
    },
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

    it('should transform using custom formatter', async () => {
      const out = await buildFile('fixtures/normal/input.mjs', (config) => {
        ;(config.plugins ??= []).push(
          icuMessages({
            include: '**/*.messages.json',
            format: 'crowdin',
            output: {
              format(messages) {
                return JSON.stringify(Object.entries(messages))
              },
            },
          }),
        )
      })

      expect(out).toMatchSnapshot()
    })

    it('should handle errors as defined', async () => {
      const onParseError = vi.fn(function ({ useBuiltinStrategy }) {
        return useBuiltinStrategy('use-message-as-literal')
      } satisfies PluginOptions['onParseError'])

      const out = await buildFile('fixtures/errored/input.mjs', (config) => {
        ;(config.plugins ??= []).push(
          icuMessages({
            format: 'crowdin',
            onParseError,
          }),
        )
      })

      expect(out).toMatchSnapshot()

      expect(onParseError.mock.calls).toHaveLength(1)

      const context = onParseError.mock.calls[0][0]

      expect(context).toBeDefined()

      const { message, messageId, error } = context

      expect({
        message,
        messageId,
        error,
        moduleId: basename(context.moduleId),
        locale: context.parserOptions?.locale?.baseName,
      }).toMatchInlineSnapshot(`
        {
          "error": [SyntaxError: INVALID_TAG],
          "locale": "en",
          "message": "Hello, <bold>{name}</bold!",
          "messageId": "greeting",
          "moduleId": "en.messages.json",
        }
      `)

      expect(onParseError.mock.results[0]).toMatchInlineSnapshot(`
        {
          "type": "return",
          "value": [
            {
              "type": 0,
              "value": "Hello, <bold>{name}</bold!",
            },
          ],
        }
      `)
    })

    it('should pass parsing fc to error handler', async () => {
      const onParseError = vi.fn(function ({
        message,
        useBuiltinStrategy,
        parseMessage,
        parserOptions,
      }) {
        try {
          return parseMessage(message, { ...parserOptions, ignoreTag: true })
        } catch (e) {
          return useBuiltinStrategy('use-message-as-literal')
        }
      } satisfies PluginOptions['onParseError'])

      const out = await buildFile('fixtures/errored/input.mjs', (config) => {
        ;(config.plugins ??= []).push(
          icuMessages({
            format: 'crowdin',
            onParseError,
          }),
        )
      })

      expect(out).toMatchSnapshot()

      const { mock } = onParseError

      expect(mock.calls?.[0]?.[0]?.parseMessage).toBeTypeOf('function')

      expect(mock.results[0]).toMatchInlineSnapshot(`
        {
          "type": "return",
          "value": [
            {
              "type": 0,
              "value": "Hello, <bold>",
            },
            {
              "type": 1,
              "value": "name",
            },
            {
              "type": 0,
              "value": "</bold!",
            },
          ],
        }
      `)
    })
  },
  { timeout: 60_000 },
)
