import { useCookie } from 'nuxt/app'
import { defineStorageAdapter } from '../storage-adapter.js'

export default defineStorageAdapter(() => {
  const cookie = useCookie('locale', {
    maxAge: 60 * 60 * 24 * 365 * 10,
    sameSite: 'strict',
    secure: true,
    httpOnly: false,
    path: '/',
  })

  return {
    read() {
      const res = cookie.value

      if (res == null || res === '') return null

      return res
    },

    save(localeCode) {
      cookie.value = localeCode
    },
  }
})
