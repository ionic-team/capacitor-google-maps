const eslintjs = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tseslintparser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'e2e-tests/**', 'unit-tests/**', 'android/**', 'ios/**', 'types/**', 'eslint.config.*'],
  },
  eslintjs.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tseslintparser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        HTMLElement: 'readonly',
        customElements: 'readonly',
        ResizeObserver: 'readonly',
        DOMRect: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        screen: 'readonly',
        navigator: 'readonly',
        GeolocationPosition: 'readonly',
        google: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },
  prettierConfig,
];

