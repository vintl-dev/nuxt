---
'@vintl/nuxt': patch
---

Add option to opt out of the import resolution

All imports except message imports (because they have to be resolved for formatter and parser to work) are now including `resolve` boolean property when using object forms to declare imports (resources or additional side-effect only imports).

By setting it to `false` imports are added as is, and not checked during the options file generation, which can help avoid hitting a problem like in Vite where import by path imports a different module than import by package name and (export) path within it.

```ts
// { from: '@vintl/compact-number/locale-data/en', resolve: true }
import '../../node_modules/@vintl/compact-number/dist/locale-data/en.js'

// { from: '@vintl/compact-number/locale-data/en', resolve: false }
import '@vintl/compact-number/locale-data/en'
```

This is a temporary solution to [#10](https://github.com/vintl-dev/nuxt/issues/10) until there's a better one.
