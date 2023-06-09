import { dataToEsm } from '@rollup/pluginutils'
import type { CompileFn } from '@formatjs/cli-lib'
import { createUnplugin, type RollupPlugin } from 'unplugin'
import { basePluginName } from '../shared/consts.ts'
import {
  createOptionsResolver,
  defaultOptionsResolver,
} from '../parser/index.ts'
import { isTransformed } from '../utils/code.ts'
import { BaseError } from '../shared/error-proto.ts'
import {
  rollupWrappingPartial,
  viteWrappingPartial,
  supportsWrapping,
} from '../wrapping/index.ts'
import type { API } from './api.ts'
import { normalizeOptions, type Options } from './options.ts'
import { parseMessages } from './message-parsing.ts'
import { compileMessages } from './message-compiling.ts'
import { readMessagesFile } from './message-reading.ts'
import type { MessagesASTMap, MessagesMap } from './types.ts'
import { createFilter } from './filter.ts'

/**
 * An error that is thrown whenever plugin encounters an error during the
 * transformation of the messages file.
 */
class TransformError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_TRANSFORM_ERROR'
}

/** Represents universal options, regardless the bundler. */
type Options_ = Options<any> | undefined

/** Unplugin that parses files containing ICU MessageFormat messages into AST. */
export const plugin = createUnplugin<Options_, false>((options_, meta) => {
  const {
    indent,
    format,
    parse,
    pluginsWrapping,
    output: outputOpts,
    ...options
  } = normalizeOptions(options_ ?? {})

  const filter = createFilter(options)

  const getParserOptions = createOptionsResolver(
    options.parserOptions,
    defaultOptionsResolver,
  )

  let compileFunc: CompileFn | undefined

  const api = { filter } satisfies API

  if (pluginsWrapping.use && !supportsWrapping(meta.framework)) {
    // eslint-disable-next-line no-console
    console.warn(
      `icu-messages: 'pluginsWrapping.enabled' is set to true, however unsupported framework is used (${meta.framework})`,
    )
  }

  async function resolveFormatter() {
    if (typeof format === 'function') {
      compileFunc = format
      return
    }

    const { getBuiltinFormatter: getBultinFormatter } = await import(
      '../formatjs/formatters.ts'
    )

    compileFunc = await getBultinFormatter(format)
  }

  /** @see https://github.com/unjs/unplugin/issues/293 */
  const buildStart = (() => {
    let buildStartCall: Promise<void> | undefined

    function buildStart() {
      if (buildStartCall != null) {
        throw new BaseError('buildStart() has already been called')
      }

      return (buildStartCall = (async () => {
        try {
          return await resolveFormatter()
        } finally {
          buildStartCall = undefined
        }
      })())
    }

    return {
      run: buildStart,
      async waitForCompletion() {
        await buildStartCall
      },
    }
  })()

  return {
    name: basePluginName,

    rollup: {
      ...(pluginsWrapping.use &&
        meta.framework === 'rollup' &&
        (() => {
          // unplugin doesn't have hook merging, so this is the way to go
          const { buildStart: pluginsWrap } = rollupWrappingPartial(
            pluginsWrapping,
            filter,
          )

          return {
            async buildStart(rollupOptions) {
              await buildStart.run()

              pluginsWrap?.call(this, rollupOptions)
            },
          } satisfies Omit<RollupPlugin, 'name'>
        })()),
      api,
    },

    vite: {
      ...(pluginsWrapping.use &&
        meta.framework === 'vite' &&
        viteWrappingPartial(pluginsWrapping, filter)),
      api,
    },

    webpack(_compiler) {
      _compiler.options.module.rules.push({
        test: filter,
        type: outputOpts.format === 'json' ? 'json' : 'javascript/auto',
      })
    },

    transformInclude(id) {
      return filter(id)
    },

    buildStart: buildStart.run,

    async transform(code, id) {
      try {
        await buildStart.waitForCompletion()
      } catch (err) {
        this.error(
          new BaseError('Previously invoked buildStart() failed', {
            cause: err,
          }),
        )
        return
      }

      if (compileFunc == null) {
        this.error(
          new TransformError(
            'Compiler function is missing after options hook call',
          ),
        )
        return
      }

      let rawMessages: unknown
      try {
        rawMessages = readMessagesFile(parse, code, id)
      } catch (cause) {
        let message = 'Cannot read the messages file'

        if (isTransformed(code)) {
          message +=
            ', likely because it has already been transformed by another plugin or loader'
        }

        this.error(new TransformError(message, { cause }))
        return
      }

      let messages: MessagesMap
      try {
        messages = compileMessages(compileFunc, rawMessages)
      } catch (cause) {
        throw new TransformError('Cannot compile the messages', { cause })
      }

      let data: MessagesASTMap | MessagesMap
      if (outputOpts.type === 'ast') {
        try {
          data = parseMessages(messages, getParserOptions, id)
        } catch (cause) {
          this.error(
            new TransformError('Cannot generate messages AST', { cause }),
          )
          return
        }
      } else if (outputOpts.type === 'raw') {
        data = messages
      } else {
        this.error(
          new TransformError(`Unsupported output type: ${outputOpts.type}`),
        )
        return
      }

      if (outputOpts.format === 'module') {
        return {
          code: dataToEsm(data, { indent, preferConst: true }),
          map: { mappings: '' },
        }
      } else if (outputOpts.format === 'json') {
        return {
          code: JSON.stringify(data),
          map: { mappings: '' },
        }
      } else {
        this.error(
          new TransformError(`Unsupported output format: ${outputOpts.format}`),
        )
      }
    },
  }
})
