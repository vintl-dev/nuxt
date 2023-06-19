---
'@vintl/nuxt': patch
---

Use automatic locale if none returned by the storage

Fixed a bug where automatic locale would not be restored from the storage properly on the next page reload, despite it being saved properly.
