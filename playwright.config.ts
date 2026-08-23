import 'dotenv/config';
import { defineConfig } from '@playwright/test';

const PORT = process.env.PORT || '4000';
const BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

/**
 * Playwright configuration for Contextπ API Test Suite
 * Strictly configured for API-level testing against live/seeded Express backend.
 */
export default defineConfig({
  testDir: process.env.TEST_DIR || './tests',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: process.env.REPORT_DIR || './playwright-report', open: 'never' }],
    ['json', { outputFile: './reports/summary.json' }],
    ['list']
  ],
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },
});
