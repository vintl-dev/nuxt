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
  },
  vite: {
    resolve: {
      alias: {
        '@formatjs/icu-messageformat-parser':
          '@formatjs/icu-messageformat-parser/lib/no-parser',
      },
    },
    plugins: [],
  },
})
