// We have a unplugin that pre-parses / transforms all messages files for us and
// we track every message file import, we need a special class that create
// unique plugin instances.
import type { PluginOptions } from '@vintl/unplugin'
import type { z as t } from 'zod'
import type {
  messagesImportOptionsSchema,
  messagesImportSourceSchema,
} from './schemas/messages-imports.js'

// we have two unique properties: 1) file structure format 2) file parser

type UniqueOptions = t.output<typeof messagesImportOptionsSchema>

export class PluginOptionsBank {
  // let the uniqueOptions be a map of unique options to a list of files that have the same options
  private readonly filesByOptions: Map<UniqueOptions, Set<string>> = new Map()

  private findOrCreateFileSet(optionsVariation: UniqueOptions) {
    for (const [knownOptionsVariation, files] of this.filesByOptions) {
      if (
        knownOptionsVariation.format === optionsVariation.format &&
        knownOptionsVariation.parser === optionsVariation.parser
      ) {
        return files
      }
    }

    const filteredOptions: UniqueOptions = {
      format: optionsVariation.format,
      parser: optionsVariation.parser,
    }

    const fileSet = new Set<string>()
    this.filesByOptions.set(filteredOptions, fileSet)
    return fileSet
  }

  public registerFile(
    file: t.output<typeof messagesImportSourceSchema>,
    resolvedPath: string,
  ) {
    this.findOrCreateFileSet(file).add(resolvedPath)
  }

  public createOptions<T extends { name: string }>(
    baseOptions?: PluginOptions<T>,
  ): PluginOptions<T>[] {
    const options: PluginOptions<T>[] = []

    for (const [{ format, parser }, files] of this.filesByOptions) {
      const filter = (id: string) => files.has(id)

      options.push({
        ...baseOptions,
        filter,
        format,
        parse: parser,
      })
    }

    return options
  }

  public *enumerateFiles() {
    for (const [, files] of this.filesByOptions) {
      for (const file of files) {
        yield file
      }
    }
  }
}
