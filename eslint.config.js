module.exports = [
  {
    ignores: [
      ".github/**",
      ".tools/**",
      "apps/**",
      "backend/**",
      "build/**",
      "connectors.js",
      "design/**",
      "dist/**",
      "frontend/**",
      "modules/**",
      "node_modules/**",
      "packages/**",
      "public/vendor/**",
      "scripts/**",
      "services/**",
      "sites/**",
      "src/**",
      "srv/**",
      "tools/**",
      "var/**"
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
