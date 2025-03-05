/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  testMatch: [
    "**/jest/**/*.test.ts",
  ],
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "test-results/jest/coverage",
  coverageReporters: ["json", "lcov", "text", "clover", "html"],
  reporters: [
    "default",
    ["jest-junit", {
      outputDirectory: "test-results/jest/junit",
      outputName: "junit-report.xml"
    }],
    ["jest-html-reporter", {
      outputPath: "test-results/jest/html/test-report.html"
    }]
  ],
  verbose: true,
};

export default config;
