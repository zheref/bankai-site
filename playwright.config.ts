import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 9000);
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: process.env.BASE_URL ?? `http://localhost:${port}`, trace: 'retain-on-failure', reducedMotion: 'reduce', colorScheme: 'dark' },
  webServer: process.env.BASE_URL ? undefined : { command: `pnpm exec gatsby serve -p ${port}`, port, reuseExistingServer: !process.env.CI, timeout: 120_000 },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
