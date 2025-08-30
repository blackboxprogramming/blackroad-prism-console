<!-- FILE: .eslintrc.cjs -->
module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['blackroad'],
  rules: { 'blackroad/no-raw-colors': 'error' }
};
