import type { Plugin } from 'nuxt/app'

type _NuxtApp = Parameters<Plugin>[0]

type MaybePromise<T> = T | PromiseLike<T>

export interface StorageAdapter {
  /**
   * Saves the locale preference for the user.
   *
   * @param localeCode BCP 47 of the currently locale used by the user, or
   *   `null` if automatic mode has been enabled.
   */
  save(localeCode: string | null): MaybePromise<void>

  /**
   * Retrieves the locale preference of the user.
   *
   * @returns Either BCP 47 locale code for the locale used by user or `null` if
   *   no there is no saved preference.
   */
  read(): MaybePromise<string | null>
}

/** Represents a function that takes in Nuxt context and produces adapter. */
export type StorageAdapterFactory = (nuxtApp: _NuxtApp) => StorageAdapter

export function defineStorageAdapter(
  adapterOrFactory: StorageAdapterFactory | StorageAdapter,
): StorageAdapterFactory {
  if (typeof adapterOrFactory === 'function') return adapterOrFactory

  return () => adapterOrFactory
}
