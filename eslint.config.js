const js = require('@eslint/js');

module.exports = [
  {
    ignores: ['node_modules/**', '_trash/**'],
  },
  js.configs.recommended,
  {
    files: ['srv/blackroad-api/server_full.js', 'tests/api_health.test.js', 'tests/git_api.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        it: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        setInterval: 'readonly',
      },
    },
    rules: {},
  },
];
