module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals', 'eslint:recommended', 'plugin:testing-library/react', 'plugin:jest-dom/recommended', 'prettier'],
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    'react/jsx-key': 'error'
  }
};
