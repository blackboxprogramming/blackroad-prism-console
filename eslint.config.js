module.exports = [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".github/",
      "public/vendor/",
    ],
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-undef": "warn",
    },
  },
];
