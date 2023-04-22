import { defineTheme } from 'pinceau'
import { getColors } from 'theme-colors'

const colorScheme = getColors('#6a5acd') as {
  [K in keyof NonNullable<Parameters<typeof getColors>[1]>]: string
}

export default defineTheme({
  color: {
    primary: colorScheme,
  },
})
