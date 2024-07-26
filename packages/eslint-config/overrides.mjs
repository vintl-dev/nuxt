import { defineFlatConfig } from 'eslint-flat-config-utils'

export default defineFlatConfig({
  name: 'vintl/peony',
  rules: {
    // Ma'am, this is SFCs (also conflicts with Prettier)
    'vue/html-self-closing': 'off',
    // Gladly we know how to use dynamic delete, tyvm
    '@typescript-eslint/no-dynamic-delete': 'off',
    // Vue fully supports multiple root template children
    'vue/no-multiple-template-root': 'off',
  },
})
