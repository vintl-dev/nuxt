import hash from 'hash-sum'
import { generate as fromAST } from 'astring'
import type { z as t } from 'zod'
import type {
  messagesImportSourceSchema,
  moduleOptionsSchema,
} from './schemas/index.js'

// You probably opened this file and shocked to find out the whole AST tree
// generation here. Yeah, I guess this is a bit too much, but this actually
// isn't that bad.
//
// The reason I decided to go with AST approach, even though it has obvious
// downsides like huge file size, is that it is much cleaner what your intents
// are with it, it also does some kind of checking, whereas if you were to use
// something like lodash templates that Nuxt has, you'd be writing a mess
// without any syntax highlighting and checking, and having no clue whether the
// thing is actually going to work.
//
// To see an example of code, simply create an example file by building the
// project, then running node and importing `dist/options-gen.cjs`.
//
// To make changes, use generated code using the above, open AST Explorer
// (https://astexplorer.net/), switching it to acorn/meriyah parser, and then
// make the changes to the file you want. After you've done prototyping, simply
// explore the tree you have created and try re-implement them in `generate`
// function. Any missing AST Nodes can be implemented easily, trust me - I did
// not spend much time writing below even though it may look like it. I didn't
// even have to debug much, it all just worked, unlike lodash templates or
// string generation that I had to previously use. Only things that took some
// time is finding workarounds to some rough cases like JSON or inline comments
// for webpack imports, but even that was surprisingly easy.

// interface GeneratorContext {
//   /**
//    * Resolves an import against the root directory.
//    * @param value Import to resolve.
//    * @return Resolved import.
//    */
//   resolveImport(value: string): string
// }

/** Represents an AST node. */
interface Node {
  /** Type of the node. */
  type: string
}

/** Represents a Node that has comments. */
interface Commentable {
  comments?: Comment[]

  addComments(...comments: Comment[]): this
}

class Identifier implements Node {
  public readonly type = 'Identifier'

  constructor(public name: string) {}
}

class ImportDefaultSpecifier implements Node {
  public readonly type = 'ImportDefaultSpecifier'

  constructor(public local: Identifier) {}
}

class ImportNamespaceSpecifier implements Node {
  public readonly type = 'ImportNamespaceSpecifier'

  constructor(public local: Identifier) {}
}

class ImportSpecifier implements Node {
  public readonly type = 'ImportSpecifier'

  constructor(
    public local: Identifier,
    public imported: Identifier | Literal<string> = local,
  ) {}
}

type LiteralType = string | number | boolean | null

abstract class Comment {
  constructor(public value: string) {}
}

class BlockComment extends Comment {
  public readonly type = 'Block'
}

class InlineComment extends Comment {
  public readonly type = 'Line'
}

class Literal<T extends LiteralType = LiteralType>
  implements Node, Commentable
{
  public readonly type = 'Literal'

  constructor(public value: T) {}

  public raw?: string

  public comments?: Comment[]

  public setRaw(value: string | null) {
    if (value == null) {
      delete this.raw
    } else {
      this.raw = value
    }

    return this
  }

  public addComments(...comments: Comment[]) {
    if (this.comments == null) this.comments = []

    this.comments.push(...comments)

    return this
  }
}

class VariableDeclarator implements Node {
  public readonly type = 'VariableDeclarator'

  constructor(
    public id: Identifier,
    public init: Identifier | Literal | Expression | null = null,
  ) {}
}

type VariableDeclarationKind = 'var' | 'let' | 'const'

class VariableDeclaration implements Node {
  public readonly type = 'VariableDeclaration'

  constructor(
    public kind: VariableDeclarationKind,
    public declarations: VariableDeclarator[],
  ) {
    if (
      kind === 'const' &&
      (declarations.length === 0 ||
        declarations.every((declaration) => declaration.init === null))
    ) {
      throw new Error('const variable declarations must be initialized')
    }
  }
}

class ExportSpecifier implements Node {
  public readonly type = 'ExportSpecifier'

  constructor(public local: Identifier, public exported: Identifier = local) {}
}

class ExportNamedDeclaration {
  public readonly type = 'ExportNamedDeclaration'

  public declaration: VariableDeclaration | null = null

  public specifiers: ExportSpecifier[] = []

  public source: Literal<string> | null = null

  public setDeclaration(declaration: VariableDeclaration) {
    if (this.specifiers.length > 0) {
      throw new Error(
        'Cannot set declaration for the named export containing specifiers',
      )
    }

    if (this.source != null) {
      throw new Error(
        'Cannot set declaration for the named export containing source',
      )
    }

    this.declaration = declaration

    return this
  }

  public addSpecifier(...specifiers: ExportSpecifier[]) {
    if (this.declaration != null) {
      throw new Error(
        'Cannot add specifiers to the named export containing declaration',
      )
    }

    this.specifiers.push(...specifiers)

    return this
  }

  public setSource(source: string) {
    if (this.declaration != null) {
      throw new Error(
        'Cannot set source for the named export containing declaration',
      )
    }

    this.source = new Literal(source)

    return this
  }
}

class ImportDeclaration implements Node {
  public readonly type = 'ImportDeclaration'

  constructor(public source: Literal) {}

  public specifiers: (
    | ImportDefaultSpecifier
    | ImportNamespaceSpecifier
    | ImportSpecifier
  )[] = []

  public setDefaultSpecifier(local: Identifier) {
    this.specifiers = this.specifiers.filter(
      (specifier) => specifier.type !== 'ImportDefaultSpecifier',
    )

    this.specifiers.push(new ImportDefaultSpecifier(local))

    return this
  }

  public setNamespaceSpecifier(local: Identifier) {
    if (
      this.specifiers.some((specifier) => specifier.type === 'ImportSpecifier')
    ) {
      throw new Error(
        'Cannot add namespace specifier when regular specifiers are present',
      )
    }

    this.specifiers = this.specifiers.filter(
      (specifier) => specifier.type !== 'ImportNamespaceSpecifier',
    )

    this.specifiers.push(new ImportNamespaceSpecifier(local))

    return this
  }

  public addSpecifier(
    local: Identifier,
    imported?: Identifier | Literal<string>,
  ) {
    if (
      this.specifiers.some(
        (specifier) => specifier.type === 'ImportNamespaceSpecifier',
      )
    ) {
      throw new Error(
        'Cannot add regular specifier when namespace specifier exists',
      )
    }

    this.specifiers.push(new ImportSpecifier(local, imported))

    return this
  }
}

class ThisExpression {
  public readonly type = 'ThisExpression'
}

class MemberExpression {
  public readonly type = 'MemberExpression'

  public constructor(
    public object: Literal | Identifier | Expression,
    public property: Literal | Identifier | Expression,
    public computed: boolean = false,
    public optional: boolean = false,
  ) {}
}

class CallExpression {
  public readonly type = 'CallExpression'

  public arguments: (Identifier | Literal | Expression)[]

  public constructor(
    public callee: Identifier | Literal | Expression,
    args: (Identifier | Literal | Expression)[] = [],
    public optional: boolean = false,
  ) {
    this.arguments = args
  }
}

class ImportExpression implements Node {
  public readonly type = 'ImportExpression'
  public constructor(public source: Identifier | Literal | Expression) {}
}

type Expression =
  | CallExpression
  | ThisExpression
  | MemberExpression
  | ObjectExpression
  | FunctionExpression
  | ArrowFunctionExpression
  | ImportExpression
  | AwaitExpression
  | AssignmentExpression

class ObjectPattern implements Node {
  public readonly type = 'ObjectPattern'

  public constructor(public properties: Property[] = []) {}
}

class SpreadElement implements Node {
  public readonly type = 'SpreadElement'

  public constructor(public argument: Expression | Identifier) {}
}

class ArrayPattern implements Node {
  public readonly type = 'ArrayPattern'

  public constructor(
    public elements: (
      | Identifier
      | ObjectPattern
      | ArrayPattern
      | AssignmentPattern
      | RestElement
    )[],
  ) {}
}

type Pattern = ObjectPattern | ArrayPattern | AssignmentPattern

class Property implements Node {
  public readonly type = 'Property'

  public value!: Identifier | Literal | Expression | Pattern

  public kind!: 'init' | 'get' | 'set'

  public constructor(
    public key: Identifier | Literal | Expression,
    value: Property['value'] = key,
    kind: Property['kind'] = 'init',
  ) {
    this.setValue(value, kind)
  }

  public method = false

  public shorthand = false

  public computed = false

  public setMethod(value = true) {
    if (value && this.value.type !== 'FunctionExpression') {
      throw new SyntaxError(
        'Property must be a function to be used as a method',
      )
    }

    this.method = value

    return this
  }

  public setComputed(value = true) {
    this.computed = value

    return this
  }

  public setValue(value: this['value'], kind: this['kind'] = 'init') {
    if (kind === 'get' || kind === 'set') {
      if (value.type !== 'FunctionExpression') {
        throw new SyntaxError(
          'Getter/setter value must be a function expression',
        )
      }

      if (value.async) {
        throw new SyntaxError('Getters and setters cannot be async')
      }

      if (kind === 'set') {
        if (value.params.length !== 1) {
          throw new SyntaxError('Setters must have exactly one parameter')
        }

        if (value.params[0]?.type === 'RestElement') {
          throw new SyntaxError('Setters cannot use rest parameter')
        }
      }
    }

    this.value = value
    this.kind = kind

    return this
  }

  public setShorthand(value = true) {
    if (value) {
      if (this.kind !== 'init') {
        throw new SyntaxError('Getters or setters cannot be shorthands')
      }

      if (this.key.type !== 'Identifier') {
        throw new SyntaxError(
          'Cannot change property to a shorthand if its key is not an identifier',
        )
      }

      this.value = this.key
    }

    this.shorthand = value

    return this
  }
}

class ObjectExpression implements Node {
  public readonly type = 'ObjectExpression'

  public constructor(public properties: (Property | SpreadElement)[] = []) {}
}

class AssignmentPattern implements Node {
  public readonly type = 'AssignmentPattern'

  public constructor(
    public left: Identifier,
    public right: Identifier | Expression,
  ) {}
}

class RestElement {
  public readonly type = 'RestElement'

  public argument: Identifier

  public constructor(arg: Identifier) {
    this.argument = arg
  }
}

class BlockStatement {
  public readonly type = 'BlockStatement'

  public constructor(
    public readonly body: (Statement | VariableDeclaration)[] = [],
  ) {}
}

type Parameter =
  | Identifier
  | ObjectPattern
  | ArrayPattern
  | AssignmentPattern
  | RestElement

class FunctionExpression implements Node {
  public readonly type = 'FunctionExpression'

  public constructor(
    public id: Identifier | null,
    public params: Parameter[] = [],
    public body: BlockStatement = new BlockStatement(),
    public async: boolean = false,
    public generator: boolean = false,
    public expression: boolean = false,
  ) {}
}

class ArrowFunctionExpression implements Node {
  public readonly type = 'ArrowFunctionExpression'

  public id = null

  public constructor(
    public params: Parameter[] = [],
    public body: BlockStatement = new BlockStatement(),
    public async: boolean = false,
    public generator: boolean = false,
    public expression: boolean = false,
  ) {}
}

class AwaitExpression implements Node {
  public readonly type = 'AwaitExpression'

  public constructor(public argument: Identifier | Expression | Literal) {}
}

type AssignmentOperator =
  | '='
  | '+='
  | '-='
  | '*='
  | '/='
  | '%='
  | '**='
  | '<<='
  | '>>='
  | '>>>='
  | '&='
  | '^='
  | '|='
  | '&&='
  | '||='
  | '??='

class AssignmentExpression implements Node {
  public readonly type = 'AssignmentExpression'

  public constructor(
    public operator: AssignmentOperator,
    public left: Identifier | MemberExpression,
    public right: Identifier | Expression | Literal,
  ) {}
}

class ExpressionStatement implements Node {
  public readonly type = 'ExpressionStatement'

  public constructor(public expression: Expression) {}
}

class ReturnStatement implements Node {
  public readonly type = 'ReturnStatement'

  public constructor(public argument: Identifier | Expression | null = null) {}
}

type Statement = ExpressionStatement | BlockStatement | ReturnStatement

class Program implements Node, Commentable {
  public readonly type = 'Program'

  public constructor(
    public body: (
      | Statement
      | ExportNamedDeclaration
      | ImportDeclaration
    )[] = [],
    public sourceType: 'module' | 'script' = 'module',
  ) {}

  public comments?: Comment[]

  public addComments(...comments: Comment[]) {
    if (this.comments == null) this.comments = []

    this.comments.push(...comments)

    return this
  }
}

function computeRawWithComments(literal: Literal) {
  let commentContents = ''

  for (const comment of literal.comments ?? []) {
    const prog = new Program().addComments(comment)
    commentContents += fromAST(prog, { comments: true }).trim()
    commentContents += ' '
  }

  literal.raw = undefined
  literal.raw = commentContents + fromAST(literal, { comments: false })
}

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
): ImportExpression {
  const sourceLiteral = new Literal(source)

  computeRawWithComments(
    sourceLiteral.addComments(
      new BlockComment(webpackMagicComment(magicValues)),
    ),
  )

  return new ImportExpression(sourceLiteral)
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
    file: t.output<typeof messagesImportSourceSchema>,
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

/**
 * Takes in active options object, internally generates an AST tree for it and
 * then renders it to actual JavaScript code. The resulting code can be written
 * to a special file and read at runtime to retrieve the options.
 */
export function generate(
  opts: t.output<typeof moduleOptionsSchema>,
  {
    resolve,
    resolveRuntimeModule,
    registerMessagesFile,
    state,
  }: GeneratorContext,
) {
  if (opts.defaultLocale == null) {
    throw new Error('Options are missing a default locale')
  }

  /** An array of top-most imports. */
  const imports: ImportDeclaration[] = []

  /** An array of top-most exports. */
  const exports: ExportNamedDeclaration[] = []

  /** Identifier for the import of locale loader that creates locale declarator. */
  const id$defineLocale = new Identifier('locale')

  /** Identifier for the import of locale loader that identifies value as raw. */
  const id$rawValue = new Identifier('raw')

  /** Identifier for the variable holding a locale declaration. */
  const id$localeDefinition = new Identifier('l')

  /** Expression to acquire the method that sets the messages. */
  const exp$addMessages = new MemberExpression(
    id$localeDefinition,
    new Identifier('m'),
  )

  /** Expression to acquire the method that defines a resource. */
  const exp$addResource = new MemberExpression(
    id$localeDefinition,
    new Identifier('r'),
  )

  /** Expression to acquire the method that defines a locale import. */
  const exp$addImport = new MemberExpression(
    id$localeDefinition,
    new Identifier('i'),
  )

  imports.push(
    new ImportDeclaration(
      new Literal(resolveRuntimeModule('./utils/locale-loader.js')),
    )
      .addSpecifier(id$defineLocale)
      .addSpecifier(id$rawValue),
  )

  /** An object that holds all the locales mapped by their locale code. */
  const localesObject = new ObjectExpression()

  const processedLocales: string[] = []

  for (const locale of opts.locales) {
    if (locale.tag == null) {
      throw new Error('Locale descriptor is missing a file property')
    }

    if (processedLocales.includes(locale.tag)) {
      throw new Error(`Locale "${locale.tag}" has already been processed`)
    } else {
      processedLocales.push(locale.tag)
    }

    // const localeFilePath = locale.file
    // const localeIdentifier = new Identifier(`locale${hash(locale)}`)
    const importFunctionBody = new BlockStatement()

    const chunkName = `locale-${locale.tag}`

    const localeIdentifier = `locale${hash(chunkName)}`

    const isDefaultLocale = locale.tag === opts.defaultLocale

    // var l = locale()
    importFunctionBody.body.push(
      new VariableDeclaration('var', [
        new VariableDeclarator(
          id$localeDefinition,
          new CallExpression(id$defineLocale),
        ),
      ]),
    )

    const files: t.output<typeof messagesImportSourceSchema>[] = []

    if (locale.file != null) {
      files.push(locale.file)
    }

    if (locale.files != null) {
      for (const file of locale.files) {
        files.push(file)
      }
    }

    // if (isDefaultLocale) {
    //   // import locale<hash> from "<locale path>"
    //   imports.push(
    //     new ImportDeclaration(new Literal(localeFilePath)).setDefaultSpecifier(
    //       localeIdentifier,
    //     ),
    //   )

    //   // l.m(raw("<locale path>"))
    //   importFunctionBody.body.push(
    //     new ExpressionStatement(
    //       new CallExpression(exp$setMessages, [
    //         new CallExpression(id$rawValue, [localeIdentifier]),
    //       ]),
    //     ),
    //   )
    // } else {
    //   // l.m(import("<locale path>"))
    //   importFunctionBody.body.push(
    //     new ExpressionStatement(
    //       new CallExpression(exp$setMessages, [
    //         webpackMagicImportAST(localeFilePath, { chunkName }),
    //       ]),
    //     ),
    //   )
    // }

    for (const messageFile of files) {
      const { from: importPath, name: importKey } = messageFile
      const resolvedPath = registerMessagesFile(
        messageFile,
        resolve(messageFile.from),
      )

      if (isDefaultLocale) {
        // if import key is 'default' then:
        // import locale<hash>$m<import hash> from "<import path>"
        // else:
        // import { "<importKey>" as locale<hash>$m<import hash> } from "<import path>"

        const resourceImportIdentifier = new Identifier(
          `${localeIdentifier}$m${hash(importPath)}`,
        )

        const resourceImport = new ImportDeclaration(new Literal(resolvedPath))

        if (importKey === 'default') {
          resourceImport.setDefaultSpecifier(resourceImportIdentifier)
        } else {
          resourceImport.addSpecifier(
            resourceImportIdentifier,
            new Literal(importKey),
          )
        }

        imports.push(resourceImport)

        // l.m(raw(<upmost import>))
        importFunctionBody.body.push(
          new ExpressionStatement(
            new CallExpression(exp$addMessages, [
              new CallExpression(id$rawValue, [resourceImportIdentifier]),
            ]),
          ),
        )
      } else {
        // l.m(import("<import path>"), "<import key>")
        const resourceAddCall = new CallExpression(exp$addMessages, [
          webpackMagicImportAST(resolvedPath, { chunkName }),
        ])

        if (importKey !== 'default') {
          resourceAddCall.arguments.push(new Literal(importKey))
        }

        importFunctionBody.body.push(new ExpressionStatement(resourceAddCall))
      }
    }

    for (const import_ of locale.additionalImports ?? []) {
      const resolvedPath = import_.resolve
        ? resolve(import_.from)
        : import_.from

      if (isDefaultLocale) {
        // import "<import path>"
        imports.push(new ImportDeclaration(new Literal(resolvedPath)))
      } else {
        // l.i(import("<import path>"))
        importFunctionBody.body.push(
          new ExpressionStatement(
            new CallExpression(exp$addImport, [
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
        // if import key is 'default' then:
        // import locale<hash>$r<import hash> from "<import path>"
        // else:
        // import { "<importKey>" as locale<hash>$r<import hash> } from "<import path>"

        const resourceImportIdentifier = new Identifier(
          `${localeIdentifier}$r${hash(importPath)}`,
        )

        const resourceImport = new ImportDeclaration(new Literal(resolvedPath))

        if (importKey === 'default') {
          resourceImport.setDefaultSpecifier(resourceImportIdentifier)
        } else {
          resourceImport.addSpecifier(
            resourceImportIdentifier,
            new Literal(importKey),
          )
        }

        imports.push(resourceImport)

        // l.r("<resource name>", raw(<upmost import>))
        importFunctionBody.body.push(
          new ExpressionStatement(
            new CallExpression(exp$addResource, [
              new Literal(resourceName),
              new CallExpression(id$rawValue, [resourceImportIdentifier]),
            ]),
          ),
        )
      } else {
        // l.r("<resource name>", import("<import path>"), "<import key>")
        const resourceAddCall = new CallExpression(exp$addResource, [
          new Literal(resourceName),
          webpackMagicImportAST(resolvedPath, { chunkName }),
        ])

        if (importKey !== 'default') {
          resourceAddCall.arguments.push(new Literal(importKey))
        }

        importFunctionBody.body.push(new ExpressionStatement(resourceAddCall))
      }
    }

    // we implement 'then' on the locale definition so it can be just
    // return await l
    importFunctionBody.body.push(
      new ReturnStatement(new AwaitExpression(id$localeDefinition)),
    )

    const localeObject = new ObjectExpression()

    localeObject.properties.push(
      new Property(
        new Identifier('importFunction'),
        new FunctionExpression(null, [], importFunctionBody, true),
      ).setMethod(),
    )

    if (locale.meta != null) {
      localeObject.properties.push(
        new Property(new Identifier('meta')).setValue(
          new Literal(null).setRaw(JSON.stringify(locale.meta)),
        ),
      )
    }

    localesObject.properties.push(
      new Property(new Literal(locale.tag), localeObject),
    )
  }

  exports.push(
    new ExportNamedDeclaration().setDeclaration(
      new VariableDeclaration('const', [
        new VariableDeclarator(
          new Identifier('localeDefinitions'),
          localesObject,
        ),
      ]),
    ),
  )

  // exports.push(
  //   new ExportNamedDeclaration().setDeclaration(
  //     new VariableDeclaration('const', [
  //       new VariableDeclarator(
  //         new Identifier('baseURL'),
  //         new Literal(typeof opts.baseURL === 'string' ? opts.baseURL : null),
  //       ),
  //     ]),
  //   ),
  // )

  exports.push(
    new ExportNamedDeclaration().setDeclaration(
      new VariableDeclaration('const', [
        new VariableDeclarator(
          new Identifier('defaultLocale'),
          new Literal(opts.defaultLocale),
        ),
      ]),
    ),
  )

  if (opts.storage == null) {
    exports.push(
      new ExportNamedDeclaration().setDeclaration(
        new VariableDeclaration('const', [
          new VariableDeclarator(
            new Identifier('storageAdapterFactory'),
            new Literal(null),
          ),
        ]),
      ),
    )
  } else {
    let storage = opts.storage

    if (storage === 'localStorage') {
      storage = resolveRuntimeModule('./storage/local-storage.js')
    } else if (storage === 'cookie') {
      storage = resolveRuntimeModule('./storage/cookie.js')
    } else {
      storage = resolve(storage)
    }

    exports.push(
      new ExportNamedDeclaration()
        .addSpecifier(
          new ExportSpecifier(
            new Identifier('default'),
            new Identifier('storageAdapterFactory'),
          ),
        )
        .setSource(storage),
    )
  }

  exports.push(
    new ExportNamedDeclaration().setDeclaration(
      new VariableDeclaration('const', [
        new VariableDeclarator(
          new Identifier('broadcastLocaleChange'),
          new Literal(
            typeof opts.broadcastLocaleChange === 'boolean'
              ? opts.broadcastLocaleChange
              : true,
          ),
        ),
      ]),
    ),
  )

  exports.push(
    new ExportNamedDeclaration().setDeclaration(
      new VariableDeclaration('const', [
        new VariableDeclarator(
          new Identifier('seo'),
          new Literal(null).setRaw(JSON.stringify(opts.seo)),
        ),
      ]),
    ),
  )

  exports.push(
    new ExportNamedDeclaration().setDeclaration(
      new VariableDeclaration('const', [
        new VariableDeclarator(
          new Identifier('parserless'),
          new Literal(state.parserlessModeEnabled),
        ),
      ]),
    ),
  )

  return fromAST(
    new Program([...imports, ...exports]).addComments(
      new InlineComment(
        'This file is generated automatically based on your nuxt-intl module options.',
      ),
      new InlineComment(
        'Do not modify it manually, it will be re-generated every time you start your Nuxt app.',
      ),
    ),
    { comments: true },
  )
}
