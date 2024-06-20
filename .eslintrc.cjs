module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["plugin:@typescript-eslint/recommended", "plugin:vitest/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module",
  },
  plugins: ["vitest"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
  ignorePatterns: ["/dist"],
};
