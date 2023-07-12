---
'@vintl/nuxt': minor
---

Improve alternate links generation

Generation of `alternate` `hreflang` links has been improved to properly use absolute URLs.

Since there's no good way to know the URL of the site, there's now also `seo.baseURL` option which allows to set site's proper domain.

`hostLanguageParam` option has been deperecated in favour of `seo.hostLanguageParameter`, which functions almost the same way, except it does not accept `null`. If you want to disable generation of such tags or handle them yourself, you can set `seo.enabled` to `false`.

See [Configuration](https://vintl-nuxt.netlify.app/introduction/configuration#seooptions) documentation page for more details.
