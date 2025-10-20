import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const commonGlobals = {
  console: "readonly",
  window: "readonly",
  document: "readonly",
  process: "readonly",
};

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".next/",
      "public/vendor/",
      ".tools/",
      ".github/",
      "api/",
      "scripts/",
      ".eslintrc.cjs",
      "next-env.d.ts",
      "postcss.config.js",
      "src/",
      "tests/",
      "vite.config.js"
    ]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: commonGlobals,
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-console": "off",
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: commonGlobals,
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "warn",
      "no-console": "off",
    },
  },
];
