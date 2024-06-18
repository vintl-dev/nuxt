export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client && typeof window !== 'undefined') {
    Object.defineProperty(window, 'vintl', {
      configurable: true,
      writable: true,
      enumerable: true,
      value: nuxtApp.$i18n,
    })
    console.log('~'.repeat(80))
    console.log('%cHey there! 👋', 'font-size: 1.2rem')
    console.log(
      'VIntl controller can be used here through a global `vintl` variable.',
    )
    console.log(
      'Have playing with it! And if you break anything, just refresh the page :P',
    )
    if (!import.meta.dev) {
      console.log(
        '⚠️ This is a production environment. Message parsing is unavailable.',
      )
    }
    console.log('~'.repeat(80))
  }
})
