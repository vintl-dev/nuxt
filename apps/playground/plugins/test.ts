export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('i18n:extendLocale', ({ event }) => {
    console.log('[vintl] loading locale', event.locale.tag)
  })

  nuxtApp.hook('i18n:ready', () => {
    console.log('[vintl] ready')
  })
})
