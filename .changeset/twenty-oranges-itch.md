---
'@vintl/nuxt': minor
---

Update VIntl to 4.2.0

Previously VIntl was depending on Vue directly, which caused issues, and wasn't correct, as Vue is not its implementation detail. 4.2.0 made Vue a peer dependency, fixing this issue. It also brought updates to other dependencies like `@formatjs/intl`.
