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
      "server_full.js",
      "services/**",
      "sites/**",
      "src/**",
      "srv/**",
      "tests/**",
      "tools/**",
      "var/**"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        AbortController: "readonly",
        Buffer: "readonly",
        clearImmediate: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        global: "readonly",
        module: "readonly",
        process: "readonly",
        queueMicrotask: "readonly",
        require: "readonly",
        setImmediate: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly"
      }
    },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "no-undef": "warn"
    }
  }
];
