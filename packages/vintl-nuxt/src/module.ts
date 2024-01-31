import { fileURLToPath } from 'node:url'
import {
  defineNuxtModule,
  addPlugin,
  addTemplate,
  addImports,
  addComponent,
  extendViteConfig,
  extendWebpackConfig,
} from '@nuxt/kit'
import {
  relative as relativizePath,
  resolve as resolvePath,
  dirname,
} from 'pathe'
import { generate as generateOptions } from './options-gen.js'
import { createDirResolver } from './utils/resolvers.js'
import { purgeEntryResources } from './manifest-clean.js'
import { PluginOptionsBank } from './parser-bank.js'
import { consola } from 'consola'
import {
  normalizeModuleOptions,
  assertModuleOptionsValid,
  type ModuleOptions,
} from './options/index.ts'
import { getErrorSummary } from './utils/error.ts'
import { OptionsError } from './errors.ts'
import { indent } from './utils/strings.ts'
import fmt from 'picocolors'
import type { ResolvedNuxtTemplate } from '@nuxt/schema'

/** Path to the options file relative to `buildDir`. */
const optionsFilePath = 'i18n/options.mjs'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@vintl/nuxt',
    configKey: 'vintl',
    compatibility: {
      bridge: false,
      nuxt: '^3.0.0',
    },
  },
  async setup(inputOptions, nuxt) {
    await nuxt.hooks.callHook('vintl:extendOptions', inputOptions)

    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.build.transpile.push('@vintl/vintl')

    const resolveInRuntime = createDirResolver(runtimeDir)

    addPlugin(resolveInRuntime('./plugin.js').path)

    if (!nuxt.options._prepare) {
      const options = normalizeModuleOptions(inputOptions)

      try {
        assertModuleOptionsValid(options)
      } catch (err) {
        let msg = fmt.red(
          'Your VIntl for Nuxt module options have failed correctness assertion',
        )

        msg += `\n${indent(getErrorSummary(err), 2)}`

        consola.error(msg.trim())

        throw new OptionsError(
          'You have errors in your Nuxt VIntl configuration, check console log for more information',
          { cause: err },
        )
      }

      const parserlessModeEnabled = (() => {
        const { enabled } = options.parserless
        return (
          enabled !== 'never' &&
          ((enabled === 'only-prod' && !nuxt.options.dev) ||
            enabled === 'always')
        )
      })()

      const pluginOptionsBank = new PluginOptionsBank()

      const optionsFile: ResolvedNuxtTemplate = addTemplate({
        filename: optionsFilePath,
        write: true,
        getContents() {
          const resolveInResDir = createDirResolver(
            resolvePath(nuxt.options.srcDir, options.resolveDir ?? '.'),
          )

          return generateOptions(options, {
            resolve(specifier) {
              return resolveInResDir(specifier).relativeTo(optionsFile.dst)
            },
            registerMessagesFile(file, importPath) {
              return pluginOptionsBank.registerFile(
                file,
                resolvePath(dirname(optionsFile.dst), importPath),
              )
            },
            resolveRuntimeModule(specifier) {
              return resolveInRuntime(specifier).relativeTo(optionsFile.dst)
            },
            state: {
              parserlessModeEnabled,
            },
          })
        },
      })

      nuxt.hook('build:manifest', (manifest) => {
        purgeEntryResources(
          manifest,
          Array.from(pluginOptionsBank.enumerateFiles()).map((importPath) =>
            relativizePath(nuxt.options.srcDir, importPath),
          ),
        )
      })

      nuxt.options.alias['@vintl/nuxt-runtime/options'] = optionsFile.dst

      const { icuMessages } = await import('@vintl/unplugin')

      const onParseError = (() => {
        let { onParseError } = options

        if (onParseError === 'log-and-skip') {
          onParseError = (ctx) => {
            consola.warn(
              `[vintl] Cannot parse the message "${
                ctx.messageId
              }" in "${relativizePath(
                nuxt.options.srcDir,
                ctx.moduleId,
              )}". It will be skipped.`,
            )
          }
        }

        return onParseError
      })()

      extendWebpackConfig((cfg) => {
        const plugins = (cfg.plugins ??= [])
        plugins.push(
          ...pluginOptionsBank
            .createOptions({
              onParseError,
              output: {
                type: parserlessModeEnabled ? 'ast' : 'raw',
              },
            })
            .map((pluginOptions) => icuMessages.webpack(pluginOptions)),
        )
      })

      extendViteConfig((cfg) => {
        const plugins = (cfg.plugins ??= [])
        plugins.push(
          ...pluginOptionsBank
            .createOptions({
              pluginsWrapping: true,
              onParseError,
              output: {
                type: parserlessModeEnabled ? 'ast' : 'raw',
              },
            })
            .map((pluginOptions) => icuMessages.vite(pluginOptions)),
        )
      })

      if (parserlessModeEnabled) {
        extendViteConfig((cfg) => {
          const aliases = ((cfg.resolve ??= {}).alias ??= {})
          if (Array.isArray(aliases)) {
            aliases.push({
              find: '@formatjs/icu-messageformat-parser',
              replacement: '@formatjs/icu-messageformat-parser/lib/no-parser',
            })
          } else {
            Object.assign(aliases, {
              '@formatjs/icu-messageformat-parser':
                '@formatjs/icu-messageformat-parser/lib/no-parser',
            })
          }
        })

        extendWebpackConfig((cfg) => {
          const aliases = ((cfg.resolve ??= {}).alias ??= {})
          if (Array.isArray(aliases)) {
            aliases.push({
              name: '@formatjs/icu-messageformat-parser',
              alias: '@formatjs/icu-messageformat-parser/lib/no-parser',
            })
          } else {
            aliases['@formatjs/icu-messageformat-parser'] =
              '@formatjs/icu-messageformat-parser/lib/no-parser'
          }
        })
      }
    }

    addImports({
      from: '@vintl/vintl',
      name: 'useVIntl',
    })

    addComponent({
      filePath: '@vintl/vintl/components',
      name: 'IntlFormatted',
      export: 'IntlFormatted',
    })

    addImports({ from: '@formatjs/intl', name: 'defineMessages' })
    addImports({ from: '@formatjs/intl', name: 'defineMessage' })
  },
})

export interface ModuleHooks {
  'vintl:extendOptions'(options: ModuleOptions): Promise<void> | void
}
