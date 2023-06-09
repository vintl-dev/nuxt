---
'@vintl/nuxt': patch
---

Adapt to new export conditions of the parser

`@formatjs/icu-messageformat-parser` has been updated and now has export conditions, this change adapts and fixes the error caused by the previous direct import of the file for `no-parser` alias.
