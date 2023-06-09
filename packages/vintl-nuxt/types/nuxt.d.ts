/// <reference types="nuxt" />

import type { ModuleHooks } from '../src/module.js'

declare module '@nuxt/schema' {
  interface NuxtHooks extends ModuleHooks {}
}

declare module '#imports' {
  export { useHead } from '@unhead/vue'
}
