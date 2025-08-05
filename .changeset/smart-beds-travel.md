---
'@vintl/unplugin': patch
---

Fix the order of arguments in default plugin wrapper

Plugin wrapper used to call original hook handler with incorrect order of arguments if the hook was in an object form (`transform: { handler(code, id) {...} }` as opposed to regular `transform() { ... }`).

Somehow this went unnoticed for a very long time. Likely, because no one used object form of hooks before.