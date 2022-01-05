/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
};
