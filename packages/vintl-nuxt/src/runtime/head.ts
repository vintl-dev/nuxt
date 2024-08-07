import { useRouter as _useRouter, useHead, useRequestURL } from '#imports'
import type { SEOOptions } from '@vintl/nuxt-runtime/options'
import type { IntlController } from '@vintl/vintl/controller'
import { joinURL } from 'ufo'
import { computed } from 'vue'
import type { LocationQuery, useRouter as _useRouter$type } from 'vue-router'

const useRouter = _useRouter as typeof _useRouter$type

// I wish there was a better way to do this T_T
function getSeachParams(query: LocationQuery) {
  const sp = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null) sp.append(key, v)
      }
    } else if (value != null) {
      sp.append(key, value)
    }
  })

  return sp
}

function withQueryParams(path: string, query: string) {
  return query === '' ? path : `${path}?${query}`
}

type LangHrefLink = {
  key?: string
  rel: string
  hreflang: string
  href: string
}

type HeadOptions = Omit<SEOOptions, 'enabled'>

export function initHead<T>(
  controller: IntlController<T>,
  options: HeadOptions,
) {
  const router = useRouter()

  const currentRoute = computed(() => router.currentRoute.value)

  const requestURL = useRequestURL()

  const normalizeURL = (url: string) => {
    try {
      return options.baseURL == null
        ? new URL(url, requestURL).toString()
        : joinURL(options.baseURL, url)
    } catch (err) {
      console.error(`[vintl] cannot normalize url: ${String(err)}`)
      return url
    }
  }

  useHead({
    htmlAttrs: {
      lang: () => controller.$config.locale,
    },
    link: () => {
      const route = currentRoute.value
      if (route == null) return []

      const query = String(getSeachParams(route.query))
      const { path } = route

      const hrefLangs: Map<string, LangHrefLink> = new Map()

      if (options.xDefaultHreflang) {
        const sp = new URLSearchParams(query)
        sp.delete(options.hostLanguageParameter)
        hrefLangs.set('x-default', {
          // key: `hreflang-default`,
          rel: 'alternate',
          hreflang: 'x-default',
          href: normalizeURL(withQueryParams(path, sp.toString())),
        })
      }

      for (const locale of controller.availableLocales) {
        const hrefLang = locale.meta?.static?.iso ?? locale.tag

        if (hrefLangs.has(hrefLang)) continue

        const sp = new URLSearchParams(query)
        if (
          controller.defaultLocale === locale.tag &&
          !options.defaultLocaleHasParameter
        ) {
          sp.delete(options.hostLanguageParameter)
        } else {
          sp.set(options.hostLanguageParameter, locale.tag)
        }

        hrefLangs.set(hrefLang, {
          // key: `hreflang-${locale.tag}`,
          rel: 'alternate',
          hreflang: hrefLang,
          href: normalizeURL(withQueryParams(path, sp.toString())),
        })
      }

      return Array.from(hrefLangs.values())
    },
  })
}
