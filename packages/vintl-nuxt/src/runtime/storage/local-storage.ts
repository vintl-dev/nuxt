import { defineStorageAdapter } from '../storage-adapter.js'

export default defineStorageAdapter(() => ({
  /**
   * Retrieves the current locale name from the localStorage.
   *
   * No-op if `localStorage` is not defined.
   *
   * @returns Currently saved name in localStorage, or `null` if nothing saved.
   */
  read() {
    if (typeof localStorage === 'undefined') return null

    return localStorage.getItem('locale')
  },

  /**
   * Saves the locale into `localStorage`.
   *
   * No-op if `localStorage` is not defined.
   *
   * @param localeCode Locale code to save.
   */
  save(localeCode: string | null) {
    if (typeof localStorage === 'undefined') return

    if (localeCode == null) {
      localStorage.removeItem('locale')
    } else {
      localStorage.setItem('locale', localeCode)
    }
  },
}))
