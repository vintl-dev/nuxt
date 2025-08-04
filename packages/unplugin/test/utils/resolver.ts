import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolve_ } from 'pathe'

export function createResolver(url: URL | string) {
  const resolveRoot = dirname(fileURLToPath(url))
  return function resolve(path: string) {
    return resolve_(resolveRoot, path)
  }
}
