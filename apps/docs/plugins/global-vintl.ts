export default defineNuxtPlugin((nuxtApp) => {
  if (process.client && typeof window !== null) {
    ;(window as any).vintl = nuxtApp.$i18n
    console.log('~'.repeat(80))
    console.log('%cHey there! 👋', 'font-size: 1.2rem')
    console.log(
      'VIntl controller can be used here through a global `vintl` variable.',
    )
    console.log(
      'Have playing with it! And if you break anything, just refresh the page :P',
    )
    if (!process.dev) {
      console.log(
        '⚠️ This is a production environment. Message parsing is unavailable.',
      )
    }
    console.log('~'.repeat(80))
  }
})
