# @vintl/unplugin

> Transform files containing ICU MessageFormat messages.

## Summary

This [Unplugin] plugin adds a transform hook that pre-parses all messages in the JSON file into an AST that can be used at runtime without the need to bring in a parser, allowing the bundle size to be reduced. Read more about how this works on the [Format.JS website →](https://formatjs.io/docs/guides/advanced-usage#pre-compiling-messages)

[Unplugin]: https://github.com/unjs/unplugin#unplugin

## Installation

With package manager of your choice:

**npm**

```sh
npm i -D @vintl/unplugin
```

**yarn**

```sh
yarn add -D @vintl/unplugin
```

**pnpm**

```sh
pnpm i -D @vintl/unplugin
```

## Usage

### Rollup

In your Rollup file, import `icuMessages` from `@vintl/unplugin/rollup` and then use it as a function in your `plugins` config array.

Example configuration:

```ts
import { defineConfig } from 'rollup'
import { icuMessages } from '@vintl/unplugin/rollup'

export default defineConfig({
  input: './src/index.mjs',
  output: { dir: './dist' },
  plugins: [
    icuMessages({
      include: './i18n/*.json',
      format: 'crowdin',
    }),
  ],
})
```

### Vite

Similar to Rollup, import `icuMessages` from `@vintl/unplugin/vite` and then use it as a function in your `plugins`:

```ts
import { defineConfig } from 'vite'
import { icuMessages } from '@vintl/unplugin/vite'

export default defineConfig({
  // ...
  plugins: [
    icuMessages({
      include: './i18n/*.json',
      format: 'crowdin',
    }),
  ],
})
```

### Webpack

Use `require` with `@vintl/unplugin/webpack`, destructure `icuMessages` from it, and use it as a function in your `plugins`:

```js
const { icuMessages } = require('@vintl/unplugin/webpack')

module.exports = {
  // ...
  plugins: [
    icuMessages({
      include: './i18n/*.json',
      format: 'crowdin',
    }),
  ],
}
```

### Other bundlers

Other bundlers are not really supported, but should generally work to capacity allowed by Unplugin.

## Configuring plugin

<details>
<summary>List of all options</summary>

### `PluginOptions`

#### **`include`**

- **Type**: `FilterPattern`
- **Default**: `"**/*.messages.json"`

Defines a string or regular expression, or an array of those, that should match with the file ID in order for it to be transformed.

#### **`exclude`**

- **Type**: `FilterPattern`

Defines either a single glob string or regular expression, or an array of those, specifying which file IDs should NOT be transformed.

#### **`filter`**

- **Type**: `(id: string) => boolean | null | undefined | void`

Custom filter function that checks whether the file must be transformed by the plugin.

#### **`indent`**

- **Type**: `string | number`
- **Default**: `"\t"`

Indentation used in the output file. Either a string or a number of spaces.

#### **`format`**

- **Type**: `CompileFn | string`
- **Default**: `"default"`

Either a name of the built-in formatter or function that accepts JSON object from the file and produces a record of messages keyed by their IDs.

#### **`parse`**

- **Type**: `(code: string, id: string) => void`
- **Default**: `(code) => JSON.parse(code)`

This function accepts file contents and parses it to a JavaScript value that will be passed to the format function (or resolved built-in formatter).

#### **`parserOptions`**

- **Type**: `MessagesParserOptionsValue`
- **Default**: `localeFromModuleId`

An object whose keys are message IDs and whose values are either parsing options for those messages or a resolver function that generates parsing options based on contextual information (such as module ID, message ID, and all messages).

#### **`onParseError`**

- **Type**: [`ParseErrorHandlingOption`](#parseerrorhandlingoption)
- **Default**: `undefined`

A method to handle any errors that may arise during the parsing of one of the messages.

#### **`pluginsWrapping`**

- **Type**: `boolean` `|` [`WrappingOptions<PluginType>`](#wrappingoptions)
- **Default**: `false`

Plugins wrapping enables additional hooks in compatible bundlers to prevent other plugins from transforming files that would be transformed by this plugin.

---

### `ParseErrorHandlingOption`

- **Type**: `(context: `[`ParseErrorContext`](#parseerrorcontext)`) => MessageFormatElement[] | void`

Either a name of the built-in handler, or a custom method that will accept context and may return the fallback result, throw another error, or return nothing (`undefined`) to ignore the error.

Custom methods can access the built-in handlers using the context's `useBuiltinStrategy` method and are used solely for logging.

The following built-in handlers exist:

| Name                     | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `use-message-as-literal` | Uses the unparsed message contents as a literal. |
| `use-id-as-literal`      | Uses the the message ID as a literal.            |
| `use-empty-literal`      | Uses a literal with an empty string.             |
| `skip`                   | Ignore the error and skip the message.           |

---

### `ParseErrorContext`

A read-only object containing information relevant to the parsing error, including the error itself.

#### **`moduleId`**

- **Type**: `string`

ID of the module that is being parsed.

#### **`messageId`**

- **Type**: `string`

ID of the message that cannot be parsed.

#### **`message`**

- **Type**: `string`

Message that cannot be parsed.

#### **`error`**

- **Type**: `unknown`

Error that occurred during the parsing.

#### **`parserOptions`**

- **Type**: `ParserOptions | undefined`

Parser options that were used to parse the message.

#### **`useBuiltinStrategy`**

- **Type**: `(name: ParseErrorHandlingStrategy) => MessageFormatElement[] | void`

Method used to call one of the built-in error handling strategies and return its result.

---

### `WrappingOptions`

#### **`use`**

- **Type**: `boolean`
- **Default**: `false`

Whether to enable the plugin wrapping.

#### **`extendDefaults`**

- **Type**: `boolean`
- **Default**: `true`

Whether to extend the defaults with provided `wrappers` or overwrite them.

#### **`wrappers`**

- **Type**: `WrappingFunctionsMap<PluginType>`

A map of wrapping functions that can be used to modify the behavior of plugins. The map is an object where each key is a plugin name and the value is a function that accepts a plugin object and a filter function, and mutates the plugin hooks to use the provided filter function.

</details>

## Usage with other plugins

If your configuration includes a plugin that handles JSON or other files that may conflict with this plugin, you have a few options to resolve the conflict:

- Configure this plugin to include files with other extensions and store your messages in `.messages` files instead. To do this, change the `options.include` setting to `**/*.messages`.

- Configure the conflicting plugin to exclude files processed by this plugin. For example, if you're using Rollup JSON, you can use its `exclude` option and set it to `*/i18n/*.json`.

If the option to exclude files is not available in your environment (e.g. [vitejs/vite#12168](https://github.com/vitejs/vite/issues/12168#issue-1597030246)), you can enable the ‘plugins wrapping’ option by setting `pluginsWrapping` to `true` or `{ use: true }`. This is only supported when using Vite or Rollup.

<details>
<summary>Example configuration</summary>

```ts
import { defineConfig } from 'rollup'
import json from '@rollup/plugin-json'
import { icuMessages } from '@braw/rollup-plugin-icu-messages/rollup'

export default defineConfig({
  input: './src/index.mjs',
  output: { dir: './dist' },
  plugins: [
    json(),
    icuMessages({
      include: './i18n/*.json',
      format: 'crowdin',
      pluginsWrapping: {
        use: true,
        extendDefaults: true, // <- @rollup/plugin-json is wrapped by default
        wrappers: {
          'my-json-plugin'(plugin, filter) {
            // implement plugin wrapping here
            // use filter function to check if a particular file is handled by icuMessages plugin
          },
        },
      },
    }),
  ],
})
```

</details>

## Acknowledgements

This plugin is powered by [icu-messageformat-parser](http://npm.im/@formatjs/icu-messageformat-parser) by [FormatJS](https://formatjs.io/).

## Credits

Made with 💜 by [Brawaru](https://github.com/brawaru). Released under [MIT Licence](./LICENSE).

<a href="https://github.com/Brawaru/Brawaru/blob/main/SUPPORT.md"><img alt="Support me by donating" height="56" src="https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3/assets/cozy/donate/generic-singular_vector.svg"></a>
