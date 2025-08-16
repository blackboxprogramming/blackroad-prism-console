import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.github/',
      '.tools/',
      '**/*.ts',
      '**/*.tsx',
    ],
  },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        navigator: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        location: 'readonly',
        console: 'readonly',
        Event: 'readonly',
        URL: 'readonly',
        alert: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'warn',
    },
  },
];
