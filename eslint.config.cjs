// ESLint flat config exported via CommonJS to avoid ESM loader issues
module.exports = [
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
];
