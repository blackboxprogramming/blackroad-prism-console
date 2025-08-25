module.exports = [
  {
    // Skip large directories and generated files that currently do not adhere
    // to the project's lint rules.  The main server code lives elsewhere and
    // remains linted.
    ignores: [
      'frontend/**',
      'sites/**',
      '.github/**',
      'modules/**',
      'services/**',
      'scripts/**',
      'var/**',
      'backend/**',
      'src/routes/**',
      'connectors.js',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];
