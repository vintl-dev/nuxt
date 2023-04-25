---
'@vintl/nuxt': patch
---

Restore legacy resolution fields to package.json

Nuxt still uses the legacy resolution mechanism that ignores the `exports` field. So `module` and `types` also need to be present in `package.json`.
