---
'@vintl/nuxt': patch
---

Fix compatibility with newer versions of Nuxt

It seems that TypeScript has a trouble identifying similar types from different packages, which caused it to disregard any types from VIntl.

Now that the `@nuxt/schema` is moved to `devDependencies` (since it's used for types only anyway), and doesn't have to strictly match the version, this should be fixed.
