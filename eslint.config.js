const js = require("@eslint/js");
const prettier = require("eslint-config-prettier");

module.exports = [
  js.configs.recommended,
  prettier,
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".github/",
      "public/vendor/",
    ],
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-undef": "warn",
    },
  },
];
