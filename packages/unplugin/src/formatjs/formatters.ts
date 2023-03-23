import { fileURLToPath, pathToFileURL } from 'url'
import { glob } from 'glob'
import { basename, dirname, extname } from 'pathe'
import type { CompileFn } from '@formatjs/cli-lib'
import { BaseError } from '../shared/error-proto.js'

/** An error that is thrown whenever a built-in formatter cannot be resolved. */
class FormatterResolutionError extends BaseError {
  public readonly code = 'UNPLUGIN_ICU_FORMATTER_RESOLVE_ERROR'
}

/**
 * Retrieves a built-in formatter from the `@formatjs/cli-lib` package.
 *
 * @param name The name of the built-in formatter.
 * @returns The built-in formatter function.
 */
export async function getBuiltinFormatter(name: string): Promise<CompileFn> {
  const defaultFormatters = new Map<string, string>()

  let formattersIndexFile: string

  try {
    formattersIndexFile = await import('import-meta-resolve').then((mod) =>
      mod.resolve('@formatjs/cli-lib/src/formatters/index.js', import.meta.url),
    )

    if (formattersIndexFile == null) {
      // eslint-disable-next-line no-throw-literal
      throw `resolving "@formatjs/cli-lib/src/formatters/index.js" returned ${formattersIndexFile}`
    }
  } catch (cause) {
    throw new FormatterResolutionError(
      `Cannot resolve formatters index file: ${String(cause)}`,
      { cause },
    )
  }

  if (formattersIndexFile != null) {
    const cwd = dirname(fileURLToPath(formattersIndexFile))
    const matchingFiles = await glob('*.js', {
      cwd,
      absolute: true,
    })

    for (const formatterFileName of matchingFiles) {
      const formatterName = basename(
        formatterFileName,
        extname(formatterFileName),
      )

      if (formatterFileName === 'index') continue

      defaultFormatters.set(
        formatterName,
        String(pathToFileURL(formatterFileName)),
      )
    }
  }

  const importPath = defaultFormatters.get(name)

  if (importPath == null) {
    throw new FormatterResolutionError(
      `Cannot resolve built-in formatter "${name}". Valid formatters are: ${[
        ...defaultFormatters.keys(),
      ].join(', ')}`,
    )
  }

  defaultFormatters.get(name)!

  let imported: Record<string, unknown>

  try {
    imported = await import(importPath)
  } catch (cause) {
    throw new FormatterResolutionError(
      `Cannot import built-in formatter "${name}" (resolved as "${importPath}"): ${String(
        cause,
      )}`,
      { cause },
    )
  }

  if (typeof imported.compile !== 'function') {
    throw new FormatterResolutionError(
      `Imported formatter "${name}" (resolved as "${importPath}") does not contain a compile function export`,
    )
  }

  return imported.compile as CompileFn
}
