# @vintl/nuxt

## 1.9.2

### Patch Changes

- 4244794: Add missing prepack script

  1.9.1 contained no files because during the switch I've forgotten the `prepack` script. This fixes that and brings back the files 💀

## 1.9.1

### Patch Changes

- a26c360: Switch to the official Nuxt module template

  This should resolve any issues with our Nuxt-specific imports, e.g., breakage of the Nuxt injections (added through `provide`s in plugins) due to the invalid `Plugin` type specified by our package (sorry for that!).

## 1.9.0

### Minor Changes

- efdcdb9: Replaced Zod validation with a much simpler normalization and assertion 🚀

  This brings a huge TypeScript performance boost for both maintainers and users of the module.

  Developers using the module will also be happy to discover that each option is now documented (they always were, but documentation was erased from Zod inferred types by TypeScript) and each type used in options can be exported if you need to programatically extend the options.

  Better yet? Common mistakes are still checked and pretty printed!

  See the full explanation for decision to switch from Zod in the commit message.

  🐞 If you stumble upon a bug caused by this switch, please [report them on issue tracker](https://github.com/vintl-dev/nuxt/issues).

### Patch Changes

- 9e42c63: Fixed a typo in message about message that cannot be parsed

## 1.8.1

### Patch Changes

- 114d04a: Switched to a slightly more compatible `#app` augmentation

## 1.8.0

### Minor Changes

- 9d939c1: Switched to using module ID markers

  Previously VIntl for Nuxt kept track of files that were used as locale messages and matched module IDs based on them. This, however, was very unreliable in certain environments.

  With this change VIntl for Nuxt now uses ‘markers’, URL parameters added to the end of imported module IDs. This allows it to very quickly test whether a specific module is imported through a message file and should be processed by the VIntl unplugin.

## 1.7.1

### Patch Changes

- 6479891: VIntl updated to the latest version

  Latest version of VIntl fixes missing type declarations for global properties, like `$t`, `$fmt` and `$i18n`.

  We might add automatic handling for disabling of `controllerOpts.globalMixin` in the future releases. You can follow the status update in [#74](https://github.com/vintl-dev/nuxt/issues/74).

  For now, if you disable global mixin, use the below augmentation to disable these unusable properties:

  ```ts
  declare global {
    namespace VueIntlController {
      interface Options {
        globalMixin: false
      }
    }
  }
  ```

## 1.7.0

### Minor Changes

- a9fdc59: Add support for parsing the messages in the error handlers

  With [update to `@vintl/unplugin`](https://github.com/vintl-dev/unplugin/releases/tag/v1.5.0), it's now possible to use `parseMessage` from the error handler's context to parse custom messages or re-parse the current message with any modified options.

## 1.6.0

### Minor Changes

- 81c23b0: Support for parsing error handling

  `@vintl/nuxt` can now handle errors when parsing message files containing broken messages in a configurable manner.

  You can configure how errors are handled using `onParseError` module option, which can either be a name of the built-in strategy, or a function that takes in context and optionally provides fallback message AST.

  Check out documentation for more information.

### Patch Changes

- 2b5a59b: Unpin FormatJS dependencies

  We proveviously had `@formatjs/intl` pinned because of the broken ESM migration, however this has been fixed for quite some time already, so the pinned version has been to changed to a range, which ensures that `@formatjs/intl` can be updated with latest bug fixes and improvements until the next major version.

## 1.5.0

### Minor Changes

- 979f2bd: Add more SEO options

  Two options have been added to the SEO configuration:

  - `defaultLocaleHasParameter` allows to disable the host language parameter for the default locale.

    This is not recommended and not correct, because lack of the host language parameter instructs VIntl to use user's language (either the one they've used before or browser's one). However, it may be useful in some cases.

  - `xDefaultHreflang` allows to disable the `x-default` hreflang in case it's not useful to have (e.g. you disable the automatic language detection), although this is quite rare.

## 1.4.0

### Minor Changes

- e1c501c: Improve alternate links generation

  Generation of `alternate` `hreflang` links has been improved to properly use absolute URLs.

  Since there's no good way to know the URL of the site, there's now also `seo.baseURL` option which allows to set site's proper domain.

  `hostLanguageParam` option has been deperecated in favour of `seo.hostLanguageParameter`, which functions almost the same way, except it does not accept `null`. If you want to disable generation of such tags or handle them yourself, you can set `seo.enabled` to `false`.

  See [Configuration](https://vintl-nuxt.netlify.app/introduction/configuration#seooptions) documentation page for more details.

## 1.3.0

### Minor Changes

- 951f363: Add graceful fallback for unknown locales in storage

### Patch Changes

- ae71089: Use automatic locale if none returned by the storage

  Fixed a bug where automatic locale would not be restored from the storage properly on the next page reload, despite it being saved properly.

## 1.2.3

### Patch Changes

- db449d4: Fix missing options in the newer Nuxt versions

## 1.2.2

### Patch Changes

- 2590b2f: Downgrade and pin versions of FormatJS packages

  Newest versions of FormatJS packages contain exports map that result in illegal ESM as CJS imports. This downgrades them

  For more details see the issue at https://github.com/formatjs/formatjs/issues/4126.

## 1.2.1

### Patch Changes

- f62ae92: Adapt to new export conditions of the parser

  `@formatjs/icu-messageformat-parser` has been updated and now has export conditions, this change adapts and fixes the error caused by the previous direct import of the file for `no-parser` alias.

- 47f1739: Fix consola not being actually listed as a dependency or used

## 1.2.0

### Minor Changes

- 3d41dd1: Update VIntl to 4.2.0

  Previously VIntl was depending on Vue directly, which caused issues, and wasn't correct, as Vue is not its implementation detail. 4.2.0 made Vue a peer dependency, fixing this issue. It also brought updates to other dependencies like `@formatjs/intl`.

### Patch Changes

- 9756d4a: Upgrade `import-meta-resolve` to v3

## 1.1.4

### Patch Changes

- 8f4ca76: Fix compatibility with newer versions of Nuxt

  It seems that TypeScript has a trouble identifying similar types from different packages, which caused it to disregard any types from VIntl.

  Now that the `@nuxt/schema` is moved to `devDependencies` (since it's used for types only anyway), and doesn't have to strictly match the version, this should be fixed.

## 1.1.3

### Patch Changes

- 25b5acf: Don't require additionalImports to be a non-empty array

## 1.1.2

### Patch Changes

- 71b9000: Fix object import sources not resolving by default

## 1.1.1

### Patch Changes

- 70c440e: Fix arrays of imports having incorrect types

## 1.1.0

### Minor Changes

- d12429c: Add option to opt out of the import resolution

  All imports except message imports (because they have to be resolved for formatter and parser to work) are now including `resolve` boolean property when using object forms to declare imports (resources or additional side-effect only imports).

  By setting it to `false` imports are added as is, and not checked during the options file generation, which can help avoid hitting a problem like in Vite where import by path imports a different module than import by package name and (export) path within it.

  ```ts
  // { from: '@vintl/compact-number/locale-data/en', resolve: true }
  import '../../node_modules/@vintl/compact-number/dist/locale-data/en.js'

  // { from: '@vintl/compact-number/locale-data/en', resolve: false }
  import '@vintl/compact-number/locale-data/en'
  ```

  This is a temporary solution to [#10](https://github.com/vintl-dev/nuxt/issues/10) until there's a better one.

## 1.0.2

### Patch Changes

- 8554729: Restore legacy resolution fields to package.json

  Nuxt still uses the legacy resolution mechanism that ignores the `exports` field. So `module` and `types` also need to be present in `package.json`.

## 1.0.1

### Patch Changes

- bfca7c2: Export types with shims instead of module types directly

## 1.0.0

### Major Changes

- 5bb8d76: # Initial release

  I believe VIntl for Nuxt is finally ready for its initial release.

  As with any package that just releases, I cannot promise that it's going to be bug-free or fully production-ready, but it's probably good enough for small apps and general testing.

  There's a lot of work and plans going ahead, but fundamental functionality is already in place. Please remember to submit your feedback and bug reports [on GitHub](https://github.com/vintl-dev/nuxt/issues).

  You can also support me working on this project through the link below:

  <a href="https://github.com/Brawaru/Brawaru/blob/main/SUPPORT.md"><img alt="Support me by donating" height="56" src="https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3/assets/cozy/donate/generic-singular_vector.svg"></a>

  Thank you!

  — Brawaru
