import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".github/**",
      ".tools/**"
    ]
  },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { console: "readonly", process: "readonly" }
    },
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } }
    },
    ignores: ["node_modules/", "dist/", "build/", ".github/", ".tools/"],
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "warn"
    }
  }
    ignores: ["node_modules/**"],
  },
  js.configs.recommended,
  prettier,
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
      globals: {
        process: "readonly",
        console: "readonly",
        require: "readonly",
        danger: "readonly",
        message: "readonly",
        warn: "readonly",
      },
    },
    ignores: ["node_modules/", "dist/", "build/", ".github/", ".tools/"],
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-undef": "warn",
    },
  },
];
