/**
 * Describes an import in a form of a tuple containing module ID and optionally
 * the export name.
 *
 * The optional export name defaults to `'default'`.
 *
 * @example
 *   // import { en_us } from '@acme/site-translations'
 *   const americanEnglish: ImportSourceTuple = [
 *     '@acme/site-translations',
 *     'en_us',
 *   ]
 */
export type ImportSourceTuple = readonly [moduleId: string, name?: string]

export function isImportSourceTuple(
  input: unknown,
): input is ImportSourceTuple {
  return (
    Array.isArray(input) &&
    typeof input[0] === 'string' &&
    (input.length === 1 || (input.length === 2 && typeof input[1] === 'string'))
  )
}

export function normalizeImportSourceTuple(input: ImportSourceTuple) {
  const [moduleId, name = 'default'] = input
  return [moduleId, name] as const
}

export type NormalizedImportSourceTuple = ReturnType<
  typeof normalizeImportSourceTuple
>

/**
 * Describes an import in a form of an object containing module ID, and
 * optionally the export name and parameter that sets whether or not the
 * consumer of the import should try to resolve the module ID to a path or use
 * it as is.
 *
 * @example
 *   // import { en_us } from '@acme/site-translations'
 *   const americanEnglish: ImportSourceObject = {
 *     from: '@acme/site-translations',
 *     name: 'en_us',
 *     resolve: false,
 *   }
 */
export type ImportSourceObject = Readonly<{
  /** Module ID to import from. */
  from: string

  /**
   * Name of the export to import.
   *
   * @default 'default'
   */
  name?: string

  /**
   * Whether to resolve the module ID to a path.
   *
   * You most likely want to avoid resolving any IDs coming from modules.
   *
   * @default true // '@acme/site-translations' => '../../node_modules/@acme/sit...'
   */
  resolve?: boolean
}>

export function isImportSourceObject(
  input: unknown,
): input is ImportSourceObject {
  return (
    typeof input === 'object' &&
    input !== null &&
    'from' in input &&
    typeof input.from === 'string' &&
    (!('name' in input) ||
      input.name == null ||
      typeof input.name === 'string') &&
    (!('resolve' in input) ||
      input.resolve == null ||
      typeof input.resolve === 'boolean')
  )
}

export function normalizeImportSourceObject(input: ImportSourceObject) {
  const { from, name, resolve } = input
  return {
    from,
    name: name ?? 'default',
    resolve: resolve ?? true,
  } as const
}

export type NormalizedImportSourceObject = ReturnType<
  typeof normalizeImportSourceObject
>

/**
 * Describes an import in a form of a string containing module ID.
 *
 * @example
 *   // import mod from '@acme/site-translations/en-US'
 *   const americanEnglish: ImportSourceString =
 *     '@acme/site-translations/en-US'
 */
export type ImportSourceString = string

/**
 * Describes an import in either a string, a tuple or an object form.
 *
 * See {@link ImportSourceString}, {@link ImportSourceTuple} and
 * {@link ImportSourceObject} for expected inputs for each form.
 */
export type ImportSource =
  | ImportSourceString
  | ImportSourceTuple
  | ImportSourceObject

export function normalizeImportSource(input: ImportSource) {
  if (typeof input === 'string') {
    return normalizeImportSourceObject({ from: input })
  }

  if (isImportSourceTuple(input)) {
    const [from, name] = normalizeImportSourceTuple(input)
    return normalizeImportSourceObject({ from, name })
  }

  if (isImportSourceObject(input)) {
    return normalizeImportSourceObject(input)
  }

  throw new Error(
    'Cannot normalize an input that does not appear to be an import source',
  )
}

/**
 * Describes an unspecified import in a form of an object.
 *
 * @example
 *   // import '@acme/intl-extension/locale-data/en-US'
 *   const americanEnglishData: UnspecifiedImportSourceObject = {
 *     from: '@acme/intl-extension/locale-data/en-US',
 *     resolve: false,
 *   }
 */
export type UnspecifiedImportSourceObject = Omit<ImportSourceObject, 'name'>

export function isUnspecifiedImportSourceObject(
  input: unknown,
): input is UnspecifiedImportSourceObject {
  return (
    input != null &&
    typeof input === 'object' &&
    'from' in input &&
    typeof input.from === 'string' &&
    (!('resolve' in input) ||
      input.resolve == null ||
      typeof input.resolve === 'boolean')
  )
}

export function normalizeUnspecifiedImportSourceObject(
  input: UnspecifiedImportSourceObject,
) {
  const { from, resolve } = input
  return { from, resolve: resolve ?? true } as const
}

export type NormalizedUnspecifiedImportSourceObject = ReturnType<
  typeof normalizeUnspecifiedImportSourceObject
>

export type UnspecifiedImportSource = ImportSourceString | ImportSourceObject

export function normalizeUnspecifiedImportSource(
  input: UnspecifiedImportSource,
) {
  if (typeof input === 'string') {
    return normalizeUnspecifiedImportSourceObject({ from: input })
  }

  if (isUnspecifiedImportSourceObject(input)) {
    return normalizeUnspecifiedImportSourceObject(input)
  }

  throw new Error(
    'Cannot normalize an input that does not appear to be an unspecified import source',
  )
}
