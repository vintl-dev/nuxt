import type { OutputChunk } from 'rollup'
import { build } from 'vite'
import { describe, it, expect, assert } from 'vitest'
import { icuMessages } from '../dist/vite'
import { createResolver } from './utils/resolver'

const resolve = createResolver(import.meta.url)

describe('vite', () => {
  it('should generate bundle', async () => {
    const out = await build({
      plugins: [
        icuMessages({
          include: '**/*.messages.json',
          format: 'crowdin',
          pluginsWrapping: { use: true },
        }),
      ],
      build: {
        write: false,
        lib: {
          entry: resolve('fixtures/normal/input.mjs'),
          fileName: 'lib',
          formats: ['es'],
          name: 'TestOutput',
        },
      },
    })

    let entryChunk: OutputChunk | undefined

    if (Array.isArray(out)) {
      assert(out.length === 1, 'must have only one output')
      assert(out[0].output.length === 1, 'must produce only one chunk')
      entryChunk = out[0].output?.[0]
    } else {
      assert('output' in out, 'must not be a watcher')
      assert(out.output.length === 1, 'must produce only one chunk')
      entryChunk = out.output?.[0]
    }

    assert(entryChunk, 'must produce an entry chunk')

    expect(entryChunk.code).toMatchSnapshot()
  })
})
