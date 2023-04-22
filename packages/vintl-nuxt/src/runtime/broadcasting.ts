import type { IntlController } from '@vintl/vintl/controller'
import type { AfterLocaleChangeEvent } from '@vintl/vintl/events'
import { isOfType } from './utils/type-checks.js'

export function setupBroadcasting(controller: IntlController<any>) {
  if (!process.client) return

  if (typeof BroadcastChannel !== 'function') {
    console.warn(
      '[@vintl/nuxt] BroadcastChannel is not available in this browser',
    )

    return
  }

  const channel = new BroadcastChannel('@vintl/nuxt:localeChange')

  let lastBroadcast: LocaleChangeBroadcast | undefined

  function isEqualToLastBroadcast(broadcast: LocaleChangeBroadcast) {
    return (
      lastBroadcast != null &&
      lastBroadcast.automatic === broadcast.automatic &&
      lastBroadcast.locale === broadcast.locale
    )
  }

  function onLocaleChange(e: AfterLocaleChangeEvent) {
    const broadcast: LocaleChangeBroadcast = {
      locale: e.locale.tag,
      automatic: e.automatic,
    }

    if (
      ((lastBroadcast?.automatic ?? false) && broadcast.automatic) ||
      isEqualToLastBroadcast(broadcast)
    ) {
      return // no-op if automation was enabled already
    }

    channel.postMessage(broadcast)

    lastBroadcast = broadcast
  }

  function onBroadcast(event: MessageEvent<unknown>) {
    const broadcast = event.data

    if (!isLocaleChangeBroadcast(broadcast)) {
      console.warn('[@vintl/nuxt] Received an invalid broadcast', broadcast)
      return
    }

    if (isEqualToLastBroadcast(broadcast)) return

    lastBroadcast = broadcast

    controller
      .changeLocale(broadcast.automatic ? 'auto' : broadcast.locale)
      .then(
        () => {},
        (err) => {
          console.warn(
            '[@vintl/nuxt] Locale change in reaction to broadcast failed',
            err,
          )
        },
      )
  }

  controller.addEventListener('afterlocalechange', onLocaleChange)
  channel.addEventListener('message', onBroadcast)
}

function isLocaleChangeBroadcast(
  value: unknown,
): value is LocaleChangeBroadcast {
  return (
    value != null &&
    isOfType('object', value) &&
    isOfType('string', value.locale) &&
    isOfType('boolean', value.automatic)
  )
}

interface LocaleChangeBroadcast {
  locale: string
  automatic: boolean
}
