import {
  defaultLocale,
  localeDefinitions,
  storageAdapterFactory,
  broadcastLocaleChange,
  parserless,
  seo as seoOptions,
} from '@vintl/nuxt-runtime/options'
import type { LocaleDescriptor, MessageValueType } from '@vintl/vintl'
import type { IntlController } from '@vintl/vintl/controller'
import { createPlugin, type InjectedProperties } from '@vintl/vintl/plugin'
import type {
  AfterLocaleChangeEvent,
  AutomaticStateChangeEvent,
  ErrorEvent,
  LocaleChangeEvent,
  LocaleLoadEvent,
} from '@vintl/vintl/events'
import { useNavigatorLanguage } from '@vintl/vintl/sources/navigator'
import { useAcceptLanguageHeader } from '@vintl/vintl/sources/header'
import { defineNuxtPlugin } from 'nuxt/app'
import { syncCaller } from './utils/hookable.js'
import { initHead } from './head.js'
import { match as matchLocales } from '@formatjs/intl-localematcher'

export default defineNuxtPlugin(async (nuxtApp) => {
  const locales: LocaleDescriptor[] = Object.entries(localeDefinitions).map(
    ([tag, { meta }]) => ({ tag, meta }),
  )

  let locale: string | undefined

  const storage = storageAdapterFactory?.(nuxtApp) ?? null

  if (storage != null) {
    try {
      locale = (await storage.read()) ?? undefined
    } catch (err) {
      if (process.dev) {
        console.error('[@vintl/nuxt] Cannot read last used locale', err)
      }
    }
  }

  if (seoOptions.enabled) {
    let hlLocale = nuxtApp._route.query[seoOptions.hostLanguageParameter]

    if (Array.isArray(hlLocale)) {
      hlLocale = hlLocale[0]
    }

    if (hlLocale != null) {
      locale = hlLocale
    }
  }

  if (locale != null) {
    const match = matchLocales(
      [locale],
      locales.map(({ tag }) => tag),
      'en-x-placeholder',
    )

    locale = match == 'en-x-placeholder' ? undefined : match
  }

  const plugin = createPlugin<MessageValueType>({
    injectInto: [nuxtApp],
    controllerOpts: {
      defaultLocale,
      locales,
      locale,
      usePreferredLocale: locale == null,
      listen: {
        error(event) {
          nuxtApp.hooks.callHookWith(syncCaller, 'i18n:error', {
            event,
            controller: this,
          })
        },
        localechange(event) {
          nuxtApp.hooks.callHookWith(syncCaller, 'i18n:beforeLocaleChange', {
            event,
            controller: this,
          })
        },
        automatic(event) {
          nuxtApp.hooks.callHookWith(syncCaller, 'i18n:automatic', {
            event,
            controller: this,
          })
        },
        async localeload(event) {
          const locale = localeDefinitions[event.locale.tag]

          if (locale == null) {
            console.warn(
              `[@vintl/nuxt] Attempted to load a locale that is not defined: ${event.locale.tag}`,
            )
          } else {
            const { messages, resources } = await locale.importFunction()
            event.addMessages(messages)
            event.addResources(resources)
          }

          await nuxtApp.callHook('i18n:extendLocale', {
            event,
            controller: this,
          })
        },
        async afterlocalechange(event) {
          try {
            await storage?.save(event.automatic ? null : event.locale.tag)
          } catch (_err) {
            if (process.dev) {
              console.error(
                '[@vintl/nuxt] Cannot save last used locale',
                event.locale.tag,
              )
            }
          }

          await nuxtApp.hooks.callHook('i18n:afterLocaleChange', {
            event,
            controller: this,
          })
        },
      },
      preferredLocaleSources: [
        process.server
          ? (() => {
              const acceptLanguage =
                nuxtApp.ssrContext?.event.node.req.headers['accept-language']
              return useAcceptLanguageHeader(acceptLanguage)
            })()
          : useNavigatorLanguage(),
      ],
      defaultMessageOrder: parserless
        ? ['locale', 'descriptor']
        : ['descriptor', 'locale'],
    },
  })

  const controller = plugin.getOrCreateController()
  await controller.waitUntilReady()

  nuxtApp.vueApp.use(plugin)

  if (broadcastLocaleChange) {
    const { setupBroadcasting } = await import('./broadcasting.js')
    setupBroadcasting(controller)
  }

  if (seoOptions.enabled) {
    nuxtApp.hook('vue:setup', () => initHead(controller, seoOptions))
  }

  await nuxtApp.callHook('i18n:ready', controller)
})

type EventContext<E> = {
  event: E
  controller: IntlController<MessageValueType>
}

declare module 'nuxt/app' {
  interface NuxtApp
    extends InjectedProperties<VueIntlController.MessageValueTypes> {}

  interface RuntimeNuxtHooks {
    'i18n:automatic'(ctx: EventContext<AutomaticStateChangeEvent>): void

    'i18n:beforeLocaleChange'(ctx: EventContext<LocaleChangeEvent>): void

    'i18n:extendLocale'(
      ctx: EventContext<LocaleLoadEvent>,
    ): Promise<void> | void

    'i18n:afterLocaleChange'(ctx: EventContext<AfterLocaleChangeEvent>): void

    'i18n:error'(ctx: EventContext<ErrorEvent>): void

    'i18n:ready'(
      controller: IntlController<MessageValueType>,
    ): Promise<void> | void
  }
}
