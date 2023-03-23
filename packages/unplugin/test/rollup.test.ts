import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'
import { rollup } from 'rollup'
import json from '@rollup/plugin-json'
import { describe, expect, it } from 'vitest'
import TOML from '@ltd/j-toml'
import type { ParserOptions } from '@formatjs/icu-messageformat-parser/parser'
import { AnyMessage, icuMessages } from '../dist/rollup'

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

  it('exposes filter in public API', () => {
    expect(icuMessages({}).api).toHaveProperty('filter')
  })

  // TODO: add more tests
})
