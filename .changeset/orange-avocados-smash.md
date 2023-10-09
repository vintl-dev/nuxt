---
'@vintl/nuxt': patch
---

Unpin FormatJS dependencies

We proveviously had `@formatjs/intl` pinned because of the broken ESM migration, however this has been fixed for quite some time already, so the pinned version has been to changed to a range, which ensures that `@formatjs/intl` can be updated with latest bug fixes and improvements until the next major version.