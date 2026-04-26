import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['assets/tests/**/*.test.{ts,tsx}'],
    setupFiles: ['assets/tests/setup.ts'],
    globals: true,
    clearMocks: true,
  },
});
