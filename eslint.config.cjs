// <!-- FILE: eslint.config.cjs -->
module.exports = [
  {
    files: ['srv/blackroad-api/server_full.js', 'tests/api_health.test.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' },
    rules: {},
  },
];
