import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api-tests',
      use: {
        baseURL: process.env.API_URL ?? 'http://localhost:8787',
      },
    },
    {
      name: 'ui-tests',
      use: {
        baseURL: process.env.BASE_URL ?? 'http://localhost:3001',
      },
    },
  ],
});
