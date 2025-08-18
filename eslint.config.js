import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
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
