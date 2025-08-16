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
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    ...js.configs.recommended,
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    ...prettier,
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
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
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_|^[A-Z]' },
      ],
      'no-undef': 'warn',
    },
  },
];
