---
'@vintl/nuxt': minor
---

Replaced Zod validation with a much simpler normalization and assertion 🚀

This brings a huge TypeScript performance boost for both maintainers and users of the module.

Developers using the module will also be happy to discover that each option is now documented (they always were, but documentation was erased from Zod inferred types by TypeScript) and each type used in options can be exported if you need to programatically extend the options.

Better yet? Common mistakes are still checked and pretty printed!

See the full explanation for decision to switch from Zod in the commit message.

🐞 If you stumble upon a bug caused by this switch, please [report them on issue tracker](https://github.com/vintl-dev/nuxt/issues).
