export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "public/vendor/",
      ".tools/",
      ".github/",
      "src/",
      "tests/",
      "vite.config.js",
      "api/",
      "scripts/"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "warn",
      "no-console": "off"
    }
  }
];
