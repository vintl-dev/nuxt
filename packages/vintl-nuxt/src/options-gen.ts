import * as babelGenerator from '@babel/generator'
import t from '@babel/types'
import hash from 'hash-sum'
import type {
  NormalizedMessagesImportSource,
  NormalizedModuleOptions,
} from './options'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromAST = (babelGenerator as any).default
  .default as (typeof babelGenerator)['default']

interface WebpackMagicValues {
  chunkName: string
  mode: 'lazy'
}

function webpackMagicComment(values: Partial<WebpackMagicValues>) {
  return JSON.stringify({
    webpackChunkName: values.chunkName,
    webpackMode: values.mode,
  }).slice(1, -1)
}

function webpackMagicImportAST(
  source: string,
  magicValues: Partial<WebpackMagicValues>,
) {
  const sourceLiteral = t.stringLiteral(source)

  t.addComment(sourceLiteral, 'leading', webpackMagicComment(magicValues))

  return t.importExpression(sourceLiteral)
}

interface GeneratorContext {
  /**
   * Resolves a module from the root.
   *
   * @param specifier Module import specifier.
   * @returns Path relative to the options file.
   */
  resolve(specifier: string): string

  /**
   * Analytical method that is called for every generated messages import.
   *
   * @param file Input message file options.
   * @param importPath Resolved path.
   * @returns Marked import path.
   */
  registerMessagesFile(
    file: NormalizedMessagesImportSource,
    importPath: string,
  ): string

  /**
   * Resolves a module from the runtime directory.
   *
   * @param specifier Module import specifier.
   * @returns Path relative to the optons file.
   */
  resolveRuntimeModule(specifier: string): string

  /** Additional state to encode which is not included in the options. */
  state: {
    /** Whether the parserless mode is enabled. */
    parserlessModeEnabled: boolean
  }
}

export function generate(
  opts: NormalizedModuleOptions,
  {
    resolve,
    resolveRuntimeModule,
    registerMessagesFile,
    state,
  }: GeneratorContext,
) {
  if (opts.defaultLocale == null) {
    throw new Error('Options are missing a default value')
  }

  const imports: t.ImportDeclaration[] = []

  const exports: t.ExportNamedDeclaration[] = []

  const id$defineLocale = t.identifier('locale')

  const id$rawValue = t.identifier('raw')

  const id$localeDefinition = t.identifier('l')

  const exp$addMessages = t.memberExpression(
    id$localeDefinition,
    t.identifier('m'),
  )

  const exp$addResource = t.memberExpression(
    id$localeDefinition,
    t.identifier('r'),
  )

  const exp$addImport = t.memberExpression(
    id$localeDefinition,
    t.identifier('i'),
  )

  imports.push(
    t.importDeclaration(
      [
        t.importSpecifier(id$defineLocale, id$defineLocale),
        t.importSpecifier(id$rawValue, id$rawValue),
      ],
      t.stringLiteral(resolveRuntimeModule('./utils/locale-loader.js')),
    ),
  )

  const localesObject = t.objectExpression([])

  const processedLocales = new Set<string>()

  for (const locale of opts.locales) {
    if (locale.tag == null) {
      throw new Error('Locale descriptor is missing a file property')
    }

    if (processedLocales.has(locale.tag)) {
      throw new Error(`Locale ${locale.tag} has already been processed`)
    } else {
      processedLocales.add(locale.tag)
    }

    const importFunctionBody = t.blockStatement([])

    const chunkName = `locale-${locale.tag}`

    const localeIdentifier = `locale${hash(chunkName)}`

    const isDefaultLocale = locale.tag === opts.defaultLocale

    importFunctionBody.body.push(
      t.variableDeclaration('var', [
        t.variableDeclarator(
          id$localeDefinition,
          t.callExpression(id$defineLocale, []),
        ),
      ]),
    )

    for (const messageFile of locale.files) {
      const { from: importPath, name: importKey } = messageFile

      const resolvedPath = registerMessagesFile(
        messageFile,
        resolve(messageFile.from),
      )

      if (isDefaultLocale) {
        const resourceImportIdentifier = t.identifier(
          `${localeIdentifier}$m$${hash(importPath)}`,
        )

        imports.push(
          t.importDeclaration(
            importKey === 'default'
              ? [t.importDefaultSpecifier(resourceImportIdentifier)]
              : [
                  t.importSpecifier(
                    resourceImportIdentifier,
                    t.stringLiteral(importKey),
                  ),
                ],
            t.stringLiteral(resolvedPath),
          ),
        )

        importFunctionBody.body.push(
          t.expressionStatement(
            t.callExpression(exp$addMessages, [
              t.callExpression(id$rawValue, [resourceImportIdentifier]),
            ]),
          ),
        )
      } else {
        const addMessagesCall = t.callExpression(exp$addMessages, [
          webpackMagicImportAST(resolvedPath, { chunkName }),
        ])

        if (importKey !== 'default') {
          addMessagesCall.arguments.push(t.stringLiteral(importKey))
        }

        importFunctionBody.body.push(t.expressionStatement(addMessagesCall))
      }
    }

    for (const import_ of locale.additionalImports ?? []) {
      const resolvedPath = import_.resolve
        ? resolve(import_.from)
        : import_.from

      if (isDefaultLocale) {
        imports.push(t.importDeclaration([], t.stringLiteral(resolvedPath)))
      } else {
        importFunctionBody.body.push(
          t.expressionStatement(
            t.callExpression(exp$addImport, [
              webpackMagicImportAST(resolvedPath, { chunkName }),
            ]),
          ),
        )
      }
    }

    for (const [resourceName, dataImport] of Object.entries(
      locale.resources ?? {},
    )) {
      const {
        from: importPath,
        name: importKey,
        resolve: shouldResolve,
      } = dataImport

      const resolvedPath = shouldResolve ? resolve(importPath) : importPath

      if (isDefaultLocale) {
        const resourceImportIdentifier = t.identifier(
          `${localeIdentifier}$r$${hash(importPath)}`,
        )

        const resourceImport = t.importDeclaration(
          importKey === 'default'
            ? [t.importDefaultSpecifier(resourceImportIdentifier)]
            : [
                t.importSpecifier(
                  resourceImportIdentifier,
                  t.stringLiteral(importKey),
                ),
              ],
          t.stringLiteral(resolvedPath),
        )

        imports.push(resourceImport)

        importFunctionBody.body.push(
          t.expressionStatement(
            t.callExpression(exp$addResource, [
              t.stringLiteral(resourceName),
              t.callExpression(id$rawValue, [resourceImportIdentifier]),
            ]),
          ),
        )
      } else {
        const addResourceCall = t.callExpression(exp$addResource, [
          t.stringLiteral(resourceName),
          webpackMagicImportAST(resolvedPath, { chunkName }),
        ])

        if (importKey !== 'default') {
          addResourceCall.arguments.push(t.stringLiteral(importKey))
        }

        importFunctionBody.body.push(t.expressionStatement(addResourceCall))
      }
    }

    importFunctionBody.body.push(
      t.returnStatement(t.awaitExpression(id$localeDefinition)),
    )

    const localeObject = t.objectExpression([
      t.objectMethod(
        'method',
        t.identifier('importFunction'),
        [],
        importFunctionBody,
        false,
        false,
        true,
      ),
    ])

    if (locale.meta != null) {
      localeObject.properties.push(
        t.objectProperty(t.identifier('meta'), t.valueToNode(locale.meta)),
      )
    }

    localesObject.properties.push(
      t.objectProperty(t.stringLiteral(locale.tag), localeObject),
    )
  }

  exports.push(
    t.exportNamedDeclaration(
      t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier('localeDefinitions'), localesObject),
      ]),
    ),
  )

  exports.push(
    t.exportNamedDeclaration(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier('defaultLocale'),
          t.stringLiteral(opts.defaultLocale),
        ),
      ]),
    ),
  )

  if (opts.storage == null) {
    exports.push(
      t.exportNamedDeclaration(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier('storageAdapterFactory'),
            t.nullLiteral(),
          ),
        ]),
      ),
    )
  } else {
    let { storage } = opts

    // FIXME: the caller should do this!
    if (storage === 'localStorage') {
      storage = resolveRuntimeModule('./storage/local-storage.js')
    } else if (storage === 'cookie') {
      storage = resolveRuntimeModule('./storage/cookie.js')
    } else {
      storage = resolve(storage)
    }

    exports.push(
      t.exportNamedDeclaration(
        null,
        [
          t.exportSpecifier(
            t.identifier('default'),
            t.identifier('storageAdapterFactory'),
          ),
        ],
        t.stringLiteral(storage),
      ),
    )
  }

  exports.push(
    t.exportNamedDeclaration(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier('broadcastLocaleChange'),
          t.booleanLiteral(
            typeof opts.broadcastLocaleChange === 'boolean'
              ? opts.broadcastLocaleChange
              : true,
          ),
        ),
      ]),
    ),
  )

  exports.push(
    t.exportNamedDeclaration(
      t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier('seo'), t.valueToNode(opts.seo)),
      ]),
    ),
  )

  exports.push(
    t.exportNamedDeclaration(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier('parserless'),
          t.booleanLiteral(state.parserlessModeEnabled),
        ),
      ]),
    ),
  )

  const program = t.program([...imports, ...exports], undefined, 'module')

  t.addComments(program, 'leading', [
    {
      type: 'CommentLine',
      value:
        ' This file is generated automatically based on your nuxt-intl module options.',
    },
    {
      type: 'CommentLine',
      value:
        ' Do not modify it manually, it will be re-generated every time you start your Nuxt app.',
    },
  ])

  return fromAST(program).code
}
