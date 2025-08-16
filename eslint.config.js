import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['node_modules/', 'dist/', 'build/', '.github/', '.tools/', '**/*.ts'] },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'warn',
    },
  },
];
