/** @type {import('jest').Config} */
module.exports = {
  // ─── Test runner ────────────────────────────────────────────────────────────
  preset: 'ts-jest',
  testEnvironment: 'node',

  // ─── Root & pattern ─────────────────────────────────────────────────────────
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // ─── Transform ──────────────────────────────────────────────────────────────
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: { warnOnly: true },
      },
    ],
  },

  // ─── Module resolution (mirrors tsconfig paths if any) ──────────────────────
  moduleNameMapper: {},

  // ─── Coverage ───────────────────────────────────────────────────────────────
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/database/prisma/seed.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },

  // ─── Setup ──────────────────────────────────────────────────────────────────
  setupFilesAfterFramework: [],

  // ─── Performance ─────────────────────────────────────────────────────────────
  maxWorkers: '50%',
  clearMocks: true,
  restoreMocks: true,

  // ─── Verbose output ─────────────────────────────────────────────────────────
  verbose: true,
};
