import { useHead } from '#imports'
import type { IntlController } from '@vintl/vintl/controller'
import { computed } from 'vue'
import { useRouter } from 'nuxt/app'

type LocationQuery = ReturnType<
  typeof useRouter
>['currentRoute']['value']['query']

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

export function initHead(controller: IntlController<any>, hlParam: string) {
  const router = useRouter()

  const currentRoute = computed(() => router.currentRoute.value)

  useHead({
    htmlAttrs: {
      lang: () => controller.$config.locale,
    },
    link: () => {
      const route = currentRoute.value
      if (route == null) return []

      const query = String(getSeachParams(route.query))
      const { path } = route

      let defaultEntry: LangHrefLink

      {
        const sp = new URLSearchParams(query)
        sp.delete(hlParam)
        defaultEntry = {
          // key: `hreflang-default`,
          rel: 'alternate',
          hreflang: 'x-default',
          href: withQueryParams(path, sp.toString()),
        }
      }

      const hrefLangs: Map<string, LangHrefLink> = new Map()
      for (const locale of controller.availableLocales) {
        const hrefLang = locale.meta?.static?.iso ?? locale.tag

        if (hrefLangs.has(hrefLang)) continue

        const sp = new URLSearchParams(query)
        sp.set(hlParam, locale.tag)

        hrefLangs.set(hrefLang, {
          // key: `hreflang-${locale.tag}`,
          rel: 'alternate',
          hreflang: hrefLang,
          href: withQueryParams(path, sp.toString()),
        })
      }

      return [defaultEntry, ...hrefLangs.values()]
    },
  })
}
