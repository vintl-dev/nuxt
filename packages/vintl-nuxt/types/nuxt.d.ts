import type { ModuleHooks } from '../src/module.ts'

declare module '@nuxt/schema' {
  interface NuxtHooks extends ModuleHooks {}
}
