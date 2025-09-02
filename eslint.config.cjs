// ESLint flat config exported via CommonJS to avoid ESM loader issues
module.exports = [
  {
    files: ["**/*.{js,mjs,cjs,jsx}",],
    ignores: ["node_modules/","dist/","build/",".github/","public/vendor/"],
    languageOptions: { ecmaVersion: 2021, sourceType: "module" },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-undef": "warn"
    }
  }
];
