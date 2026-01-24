import nextConfig from 'eslint-config-next/core-web-vitals'
import nextTypeScriptConfig from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextConfig,
  ...nextTypeScriptConfig,
  {
    ignores: ['**/*.json', '.claude/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'react/no-children-prop': 'off',
    },
  },
]

export default eslintConfig
