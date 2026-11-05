import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src'), '@config': resolve(__dirname, 'site.config.ts') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    exclude: ['tests/build/**', 'e2e/**', 'node_modules/**'],
    coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}', 'scripts/sources/**/*.mjs'], exclude: ['src/data/generated/**', 'src/content/**', 'src/pages/**', 'src/templates/**'], reporter: ['text', 'json-summary', 'lcov'], reportsDirectory: 'coverage' },
  },
});
