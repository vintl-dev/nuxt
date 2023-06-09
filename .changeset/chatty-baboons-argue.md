---
'@vintl/nuxt': patch
---

Downgrade and pin versions of FormatJS packages

Newest versions of FormatJS packages contain exports map that result in illegal ESM as CJS imports. This downgrades them

For more details see the issue at https://github.com/formatjs/formatjs/issues/4126.
