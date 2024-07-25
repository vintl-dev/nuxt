export default defineNuxtConfig({
  extends: [],
  modules: ['@nuxt/content', '@vintl/nuxt', '@nuxt/eslint', "@nuxt/icon"],
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