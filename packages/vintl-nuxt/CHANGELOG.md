# @vintl/nuxt

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
