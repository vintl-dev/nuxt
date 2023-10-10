---
'@vintl/nuxt': minor
---

Support for parsing error handling

`@vintl/nuxt` can now handle errors when parsing message files containing broken messages in a configurable manner.

You can configure how errors are handled using `onParseError` module option, which can either be a name of the built-in strategy, or a function that takes in context and optionally provides fallback message AST.

Check out documentation for more information.
