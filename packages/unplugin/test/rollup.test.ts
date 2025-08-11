import type { ParserOptions } from '@formatjs/icu-messageformat-parser'
import TOML from '@ltd/j-toml'
import json from '@rollup/plugin-json'
import { fileURLToPath } from 'node:url'
import { basename, dirname, resolve } from 'pathe'
import { rollup } from 'rollup'
import { describe, expect, it, vi } from 'vitest'
import { AnyMessage, icuMessages, type PluginOptions } from '../dist/rollup'

describe('rollup', () => {
  it('should generate bundle', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/normal/input.mjs',
        ),
      ],
      plugins: [icuMessages({ format: 'crowdin' })],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('should fail with unresolved formatter', async () => {
    let err: unknown
    try {
      await rollup({
        input: [
          resolve(
            dirname(fileURLToPath(import.meta.url)),
            'fixtures/normal/input.mjs',
          ),
        ],
        plugins: [icuMessages({ format: 'non-existent' })],
      })
    } catch (err_) {
      err = err_
    }

    expect(err).toHaveProperty(
      'pluginCode',
      'UNPLUGIN_ICU_FORMATTER_RESOLVE_ERROR',
    )
  })

  it('should fail with pre-compiled JSON', async () => {
    let err: unknown

    try {
      const { generate } = await rollup({
        input: [
          resolve(
            dirname(fileURLToPath(import.meta.url)),
            'fixtures/normal/input.mjs',
          ),
        ],
        plugins: [json(), icuMessages({ format: 'crowdin' })],
      })

      await generate({
        format: 'esm',
      })
    } catch (err_) {
      err = err_
    }

    expect(err).toHaveProperty('pluginCode', 'UNPLUGIN_ICU_TRANSFORM_ERROR')
  })

  it('should prevent json plugins if specified', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/with-json/input.mjs',
        ),
      ],
      plugins: [
        json(),
        icuMessages({
          format: 'crowdin',
          pluginsWrapping: { use: true },
        }),
      ],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('respects parser options', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/tagless-parsing/input.mjs',
        ),
      ],
      plugins: [
        json(),
        icuMessages({
          format: 'crowdin',
          parserOptions: {
            [AnyMessage]: {
              ignoreTag: true,
            },
            'invalid-key': {
              ignoreTag: false,
            },
          },
          pluginsWrapping: { use: true },
        }),
      ],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('should parse TOML when specified', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/toml/input.mjs',
        ),
      ],
      plugins: [
        icuMessages({
          include: '**/*.messages.toml',
          format: 'crowdin',
          parse(code) {
            return TOML.parse(code)
          },
        }),
      ],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('should resolve locale options correctly', async () => {
    let defaultOptions: ParserOptions | undefined
    let messageId: string | undefined

    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/normal/input.mjs',
        ),
      ],
      plugins: [
        icuMessages({
          include: '**/*.messages.json',
          format: 'crowdin',
          parserOptions(messageId_) {
            messageId = messageId_
            return (defaultOptions = this.getDefaultOptions())
          },
        }),
      ],
    })

    await generate({ format: 'esm' })

    expect(defaultOptions).toBeDefined()
    expect(defaultOptions?.locale?.toString()).toBe('en')
    expect(messageId).toBe('greeting')
  })

  it('should resolve keyed locale options correctly', async () => {
    let defaultOptions: ParserOptions | undefined
    const messageIds: [expected: string, actual: string[]][] = []

    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/with-json/input.mjs',
        ),
      ],
      plugins: [
        icuMessages({
          include: '**/*.messages.json',
          format: 'crowdin',
          parserOptions: {
            [AnyMessage](messageId) {
              let arr = messageIds.find((it) => it[0] === '__any__')?.[1]
              if (arr == null) {
                messageIds.push(['__any__', (arr = [])])
              }
              arr.push(messageId)
            },
            greeting(messageId) {
              messageIds.push(['greeting', [messageId]])
              return this.getDefaultOptions()
            },
            goodbye(messageId) {
              messageIds.push(['goodbye', [messageId]])
              return (defaultOptions = this.getDefaultOptions())
            },
          },
        }),
        json({ exclude: '**/*.messages.json' }),
      ],
    })

    await generate({ format: 'esm' })

    expect(defaultOptions).toBeDefined()

    expect(defaultOptions?.locale?.toString()).toBe('en')

    expect(messageIds).toEqual(
      expect.arrayContaining([
        ['greeting', ['greeting']],
        ['goodbye', ['goodbye']],
        ['__any__', expect.arrayContaining(['greeting', 'goodbye'])],
      ]),
    )
  })

  it('should transform to JSON of AST', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/normal/input.mjs',
        ),
      ],
      plugins: [
        icuMessages({
          format: 'crowdin',
          output: {
            format: 'json',
          },
        }),
        json(),
      ],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('should transform to JSON of messages', async () => {
    // same as above, but output.type set to raw
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/normal/input.mjs',
        ),
      ],
      plugins: [
        icuMessages({
          format: 'crowdin',
          output: {
            format: 'json',
            type: 'raw',
          },
        }),
        json(),
      ],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('should transform using custom formatter', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/normal/input.mjs',
        ),
      ],
      plugins: [
        icuMessages({
          format: 'crowdin',
          output: {
            format(messages) {
              return JSON.stringify(Object.entries(messages))
            },
          },
        }),
        json(),
      ],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('should handle errors as defined', async () => {
    const onParseError = vi.fn(function ({ useBuiltinStrategy }) {
      return useBuiltinStrategy('use-message-as-literal')
    } satisfies PluginOptions['onParseError'])

    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/errored/input.mjs',
        ),
      ],
      plugins: [
        icuMessages({
          format: 'crowdin',
          parserOptions() {
            return {
              ...this.getDefaultOptions(),
            }
          },
          onParseError,
        }),
      ],
    })

    const { output } = await generate({ format: 'esm' })

    expect(output).toHaveLength(1)

    expect(output[0]?.code).toMatchSnapshot()

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

    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/errored/input.mjs',
        ),
      ],
      plugins: [
        icuMessages({
          format: 'crowdin',
          parserOptions() {
            return {
              ...this.getDefaultOptions(),
            }
          },
          onParseError,
        }),
      ],
    })

    const { output } = await generate({ format: 'esm' })

    expect(output).toHaveLength(1)

    expect(output[0]?.code).toMatchSnapshot()

    expect(onParseError.mock.calls).toHaveLength(1)

    const context = onParseError.mock.calls[0][0]

    expect(context).toBeDefined()

    const { parseMessage } = context

    expect(parseMessage).toBeTypeOf('function')

    expect(onParseError.mock.results[0]).toMatchInlineSnapshot(`
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

  it('exposes filter in public API', () => {
    expect(icuMessages({}).api).toHaveProperty('filter')
  })

  // TODO: add more tests
})
