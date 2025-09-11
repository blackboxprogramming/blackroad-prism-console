module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".github/**",
      "public/vendor/**",
      "var/**",
      "backend/**",
      "frontend/**",
      "sites/**",
      "src/**",
      "srv/**",
      "apps/**",
      "packages/**",
      ".tools/**",
      "modules/**",
      "scripts/**",
      "services/**",
      "design/**",
      "connectors.js"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "no-undef": "warn"
    }
  }
];
