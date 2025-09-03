// ESLint flat config exported via CommonJS to avoid ESM loader issues
module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      ".github/**",
      "public/vendor/**",
      "var/**",
      "sites/**",
      ".tools/**",
      "frontend/**",
      "modules/**",
      "scripts/**",
      "services/**",
      "srv/**",
      "src/routes/subscribe.js",
      "eslint.config.cjs"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "warn"
    }
  }
];
