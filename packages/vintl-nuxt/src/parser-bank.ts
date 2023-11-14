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

class Marker {
  private readonly regExp: RegExp

  public constructor(public readonly marker: string) {
    this.regExp = new RegExp(`(\\?|&)${marker}(&|$)`)
  }

  public apply(id: string) {
    return `${id}${id.includes('?') ? '&' : '?'}${this.marker}`
  }

  public matches(id: string) {
    return this.regExp.test(id)
  }
}

class MarkedFileSet extends Set<string> {
  public readonly marker: Marker

  constructor(marker: Marker, iterable?: Iterable<string> | null | undefined) {
    super(iterable)
    this.marker = marker
  }
}

export class PluginOptionsBank {
  // let the uniqueOptions be a map of unique options to a list of files that have the same options
  private readonly filesByOptions = new Map<UniqueOptions, MarkedFileSet>()

  private incrementingMarker = 0

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

    const marker = new Marker(`icu-messages-${this.incrementingMarker++}`)

    const fileSet = new MarkedFileSet(marker)
    this.filesByOptions.set(filteredOptions, fileSet)
    return fileSet
  }

  public registerFile(
    file: t.output<typeof messagesImportSourceSchema>,
    resolvedPath: string,
  ) {
    const { marker } = this.findOrCreateFileSet(file).add(resolvedPath)
    return marker.apply(resolvedPath)
  }

  public createOptions<T extends { name: string }>(
    baseOptions?: PluginOptions<T>,
  ): PluginOptions<T>[] {
    const options: PluginOptions<T>[] = []

    for (const [{ format, parser }, files] of this.filesByOptions) {
      const filter = (id: string) => files.marker.matches(id)

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
