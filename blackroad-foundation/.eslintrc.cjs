module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parserOptions: { sourceType: "module" },
  ignorePatterns: ["dist", "node_modules", "**/*.ts", "**/*.tsx"],
  extends: ["eslint:recommended"],
};
