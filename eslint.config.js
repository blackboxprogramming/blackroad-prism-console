// Minimal ESLint config to avoid requiring external package '@eslint/js'
// This is a temporary change so lint can run in restricted environments.
module.exports = [
  {
    ignores: ['node_modules', '_trash'],
    files: ['srv/blackroad-api/server_full.js', 'tests/api_health.test.js'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      globals: {
        // node & commonjs globals
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        // jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      // keep defaults; project-specific rules can be added later
    },
  },
];
