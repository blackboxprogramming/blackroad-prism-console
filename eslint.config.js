const js = require('@eslint/js');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'srv/blackroad/web/vendor/**',
      'var/**',
      'sites/**/node_modules/**',
      'public/vendor/**',
      '_trash/**',
    ],
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
      },
    },
  },
  js.configs.recommended,
  {
    files: [
      'srv/blackroad-api/**/*.js',
      'tests/api_health.test.js',
      'tests/git_api.test.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        describe: 'readonly',
        jest: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {},
  },
];
