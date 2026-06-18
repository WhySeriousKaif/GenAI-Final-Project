// Jest configuration for the backend test suite.
// Tests are written to be DB-free and network-free: they characterize the AI,
// RAG, and extraction layers (the primary refactor targets) without requiring
// MongoDB or the Gemini API, so the suite runs deterministically offline.
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  verbose: true
};
