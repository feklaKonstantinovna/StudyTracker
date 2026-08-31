import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './autotests_ui/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/study-tracker_2.html',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
