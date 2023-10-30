---
'@vintl/nuxt': patch
---

VIntl updated to the latest version

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
