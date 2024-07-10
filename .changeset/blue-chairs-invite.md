---
'@vintl/nuxt': patch
---

Switch to the official Nuxt module template

This should resolve any issues with our Nuxt-specific imports, e.g., breakage of the Nuxt injections (added through `provide`s in plugins) due to the invalid `Plugin` type specified by our package (sorry for that!).
