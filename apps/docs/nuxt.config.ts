export default defineNuxtConfig({
  extends: ['@nuxt-themes/docus'],
  modules: ['@vintl/nuxt', '@nuxt/eslint'],
  vintl: {
    defaultLocale: 'en-US',
    locales: [
      {
        tag: 'en-US',
        file: './locales/en-US.json',
      },
      {
        tag: 'uk',
        file: './locales/uk.json',
      },
    ],
  },
})
