// jest.config.js
// Jest configuration for unit + integration tests.

const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^nanoid$": require.resolve("nanoid"),
  },
  transformIgnorePatterns: [
    "node_modules/(?!(nanoid|@panva|jose|uuid|@auth)/.*)",
  ],
  // Ignore Playwright tests — those go through `npx playwright test`
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "/e2e/", // matches both tests/e2e/ AND test.ts/e2e/
  ],
  collectCoverageFrom: [
    "src/lib/**/*.{ts,tsx}",
    "src/app/api/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 50,
      branches: 40,
      statements: 50,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
