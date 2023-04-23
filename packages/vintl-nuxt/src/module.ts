import { fileURLToPath } from 'node:url'
import {
  defineNuxtModule,
  addPlugin,
  addTemplate,
  addImports,
  addComponent,
  addVitePlugin,
  addWebpackPlugin,
} from '@nuxt/kit'
import { relative as relativizePath, resolve as resolvePath } from 'pathe'
import { generate as generateOptions } from './options-gen.js'
import { createDirResolver } from './utils/resolvers.js'
import { purgeEntryResources } from './manifest-clean.js'
import { type z as t, ZodError } from 'zod'
import { moduleOptionsSchema } from './schemas/index.js'
import { PluginOptionsBank } from './parser-bank.js'
import { formatZodError } from './utils/zod-error.js'
import { OptionsError } from './errors.js'
import * as consola from 'console'

/** Path to the options file relative to `buildDir`. */
const optionsFilePath = 'i18n/options.mjs'

type _InputModuleOptions = typeof moduleOptionsSchema

export interface InputModuleOptions extends t.input<_InputModuleOptions> {}

export default defineNuxtModule<InputModuleOptions>({
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

    addPlugin((await resolveInRuntime('./plugin.js')).path)

    if (!nuxt.options._prepare) {
      let options: t.output<typeof moduleOptionsSchema>

      try {
        options = moduleOptionsSchema.parse(inputOptions)
      } catch (err) {
        if (err instanceof ZodError) {
          consola.error(
            formatZodError(err, {
              initialMessage: 'Invalid Nuxt VIntl configuration',
              rootPropertyName: 'vintl',
            }),
          )

          throw new OptionsError(
            'You have errors in your Nuxt VIntl configuration, check console log for more information',
          )
        }

        throw err
      }

      const pluginOptionsBank = new PluginOptionsBank()

      const optionsFile = addTemplate({
        filename: optionsFilePath,
        write: true,
        async getContents() {
          const resolveInResDir = createDirResolver(
            resolvePath(nuxt.options.srcDir, options.resolveDir ?? '.'),
          )

          return await generateOptions(options, {
            async resolve(specifier) {
              return (await resolveInResDir(specifier)).relativeTo(
                optionsFile.dst,
              )
            },
            registerMessagesFile(file, importPath) {
              pluginOptionsBank.registerFile(file, importPath)
              return file
            },
            async resolveRuntimeModule(specifier) {
              return (await resolveInRuntime(specifier)).relativeTo(
                optionsFile.dst,
              )
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

      const parserlessEnabled = (() => {
        const { enabled } = options.parserless
        return (
          enabled !== 'never' &&
          ((enabled === 'only-prod' && !nuxt.options.dev) ||
            enabled === 'always')
        )
      })()

      const { icuMessages } = await import('@vintl/unplugin')

      addVitePlugin(
        pluginOptionsBank
          .createOptions({
            pluginsWrapping: true,
            output: {
              type: parserlessEnabled ? 'ast' : 'raw',
            },
          })
          .map((pluginOptions) => icuMessages.vite(pluginOptions)),
      )

      addWebpackPlugin(
        pluginOptionsBank
          .createOptions({
            output: {
              type: parserlessEnabled ? 'ast' : 'raw',
            },
          })
          .map((pluginOptions) => icuMessages.webpack(pluginOptions)),
      )
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
  'vintl:extendOptions'(
    options: t.input<typeof moduleOptionsSchema>,
  ): Promise<void> | void
}
