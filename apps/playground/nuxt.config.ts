// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@vintl/nuxt'],
  vintl: {
    defaultLocale: 'en-US',
    locales: [
      {
        tag: 'en-US',
        files: [
          {
            from: '@vintl-dev/pg-messages/en-US',
            format: 'crowdin',
          },
          {
            from: './locales/en-US.json',
            format: 'crowdin',
          },
        ],
        meta: {
          static: {
            iso: 'en',
          },
        },
      },
      {
        tag: 'uk',
        files: [
          {
            from: './locales/uk.json',
            format: 'crowdin',
          },
        ],
      },
    ],
    storage: 'cookie',
    broadcastLocaleChange: true,
    parserless: 'always',
    seo: {
      xDefaultHreflang: false,
      defaultLocaleHasParameter: false,
    },
  },
})
