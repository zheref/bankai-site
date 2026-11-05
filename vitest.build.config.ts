import { defineConfig } from 'vitest/config';

/** The build lane: two full `gatsby build`s (production flags; SHOW_PRICING=true) and assertions over public/. Slow by design; `pnpm test:build`. */
export default defineConfig({
  test: { globals: true, environment: 'node', pool: 'forks', include: ['tests/build/**/*.test.ts'], testTimeout: 15 * 60 * 1000, hookTimeout: 15 * 60 * 1000, fileParallelism: false },
});
