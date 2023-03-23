/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    deps: {
      // registerNodeLoader: true,
    },
    threads: false, // makes harder to debug
  },
})
