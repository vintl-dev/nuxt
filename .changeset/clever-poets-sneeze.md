---
'@vintl/nuxt': minor
---

Add more SEO options

Two options have been added to the SEO configuration:

- `defaultLocaleHasParameter` allows to disable the host language parameter for the default locale.

  This is not recommended and not correct, because lack of the host language parameter instructs VIntl to use user's language (either the one they've used before or browser's one). However, it may be useful in some cases.

- `xDefaultHreflang` allows to disable the `x-default` hreflang in case it's not useful to have (e.g. you disable the automatic language detection), although this is quite rare.
