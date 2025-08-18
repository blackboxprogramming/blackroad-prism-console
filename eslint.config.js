module.exports = [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {},
  },
];
