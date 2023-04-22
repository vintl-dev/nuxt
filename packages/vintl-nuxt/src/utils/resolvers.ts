import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve as rawResolve } from 'import-meta-resolve'
import { dirname, join as joinPaths, relative as relativizePath } from 'pathe'
import slash from 'slash'

export function createDirResolver(dir: string) {
  const pseudoParent = pathToFileURL(joinPaths(dir, '.resolve-root')).toString()

  return async function resolve(specifier: string) {
    const resolved = await rawResolve(specifier, pseudoParent)

    return {
      /** A getter that returns resolved URL as is. */
      get url() {
        return resolved
      },
      /** A getter that converts resolved URL in a form of POSIX path. */
      get path() {
        return slash(fileURLToPath(resolved))
      },
      /**
       * Converts resolved path to a relative path from the provided directory.
       *
       * @param from Directory to get relative path to the resolved path from.
       * @returns Relative to the directory path.
       */
      relativeToDir(from: string) {
        return relativizePath(slash(from), this.path)
      },
      /**
       * Converts resolved path to a relative path from the provided file.
       *
       * @param from File from which the module is imported relatively.
       * @returns Relative to the file path.
       */
      relativeTo(from: string) {
        return this.relativeToDir(dirname(from))
      },
    }
  }
}

export async function resolveToPath(specifier: string, parent: string) {
  return slash(fileURLToPath(await rawResolve(specifier, parent)))
}
