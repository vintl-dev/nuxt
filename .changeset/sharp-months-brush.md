---
'@vintl/nuxt': minor
---

Switched to using module ID markers

Previously VIntl for Nuxt kept track of files that were used as locale messages and matched module IDs based on them. This, however, was very unreliable in certain environments.

With this change VIntl for Nuxt now uses ‘markers’, URL parameters added to the end of imported module IDs. This allows it to very quickly test whether a specific module is imported through a message file and should be processed by the VIntl unplugin.
