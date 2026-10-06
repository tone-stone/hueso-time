import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'data/**/*.test.ts', 'backend/src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
