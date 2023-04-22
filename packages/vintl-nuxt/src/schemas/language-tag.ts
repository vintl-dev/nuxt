import { z as t } from 'zod'

export const languageTagSchema = t
  .string({
    description: 'BCP 47 language tag',
  })
  .nonempty()
  .refine(
    (value) => {
      try {
        new Intl.Locale(value)
        return true
      } catch (err) {
        return false
      }
    },
    {
      message:
        'Language tag must be a valid BCP 47 language tag (Intl.Locale instantiation failed)',
    },
  )
