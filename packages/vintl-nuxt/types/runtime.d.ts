declare module '@vintl/nuxt-runtime/options' {
  import type { MessagesMap } from '@vintl/vintl'
  import type { StorageAdapterFactory } from '../src/runtime/storage-adapter.js'

  export interface LocaleImport {
    messages: MessagesMap
    resources: VueIntlController.LocaleResources
  }

  /**
   * Represents a function that imports all necessary files required by the
   * locale, including locale's own messages, and returns them.
   *
   * @returns Promise that resolves with locale's messages.
   */
  export type LocaleImportFunction = () => Promise<LocaleImport>

  /**
   * Represents a locale definition, generated automatically from the building
   * based on the values in the module's config.
   */
  export interface LocaleDefinition {
    /** Function to import required locale's requirements and own messages. */
    importFunction: LocaleImportFunction

    /** Additional custom data associated with the locale. */
    meta?: VueIntlController.LocaleMeta
  }

  /**
   * Represents an automatically generated map of locale definitions, including
   * import functions and custom data. All generated from the module config.
   */
  export type LocalesDefinitionsMap = Record<string, LocaleDefinition>

  /** Base URL of the site (domain name). */
  export const baseURL: string | null

  /**
   * Default locale as specified in the module config, to use when user's locale
   * has not been set and cannot be detected automatically based on the
   * browser's settings.
   */
  export const defaultLocale: string

  /**
   * All locales that were specified in the module config, with import functions
   * and associated custom data.
   */
  export const localeDefinitions: LocalesDefinitionsMap

  /** Storage adapter used to save or retrieve user preference. */
  export const storageAdapterFactory: StorageAdapterFactory | null

  /** Whether to broadcast locale changes to other tabs. */
  export const broadcastLocaleChange: boolean

  /** Name of the `hostLanguage` parameter or its name. */
  export const hostLanguageParam: string | null

  /**
   * Whether the parserless mode is enabled and message loading order must be
   * changed to prioritise the default locale messages rather than the
   * descriptor.
   */
  export const parserless: boolean
}
