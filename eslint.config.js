const js = require('@eslint/js')
const globals = require('globals')
const tseslint = require('typescript-eslint')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'build/',
      'android/',
      'supabase/',
      'test-results/',
      '*.config.js',
    ],
  },
  { settings: { react: { version: 'detect' } } },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs['recommended-latest'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
      globals: { ...globals.browser, ...globals.node, ...globals.es2022 },
    },
    rules: {
      // Clean Code — pas de any
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      // Clean Code — pas de variables inutilisées
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      // Clean Code — retours explicites
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      'react-hooks/exhaustive-deps': 'warn',
      // Qualité
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: globals.node },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
)
