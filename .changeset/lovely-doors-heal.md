---
'@vintl/nuxt': minor
---

Add support for parsing the messages in the error handlers

With [update to `@vintl/unplugin`](https://github.com/vintl-dev/unplugin/releases/tag/v1.5.0), it's now possible to use `parseMessage` from the error handler's context to parse custom messages or re-parse the current message with any modified options.
