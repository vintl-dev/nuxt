# @vintl/nuxt

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
