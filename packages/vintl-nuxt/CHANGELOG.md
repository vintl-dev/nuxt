# @vintl/nuxt

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
