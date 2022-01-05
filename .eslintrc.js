module.exports = {
  env: {
    browser: true,
    es2021: true,
    "jest/globals": true,
  },
  extends: [
    //'xo',
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
  ignorePatterns: ["/dist"],
};
