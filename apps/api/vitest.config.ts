import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@mmpi2/auth': fileURLToPath(new URL('../../packages/auth/src/index.ts', import.meta.url)),
      '@mmpi2/config': fileURLToPath(new URL('../../packages/config/src/index.ts', import.meta.url)),
      '@mmpi2/contracts': fileURLToPath(new URL('../../packages/contracts/src/index.ts', import.meta.url)),
      '@mmpi2/reports': fileURLToPath(new URL('../../packages/reports/src/index.ts', import.meta.url)),
      '@mmpi2/scoring': fileURLToPath(new URL('../../packages/scoring/src/index.ts', import.meta.url)),
    },
  },
  test: {
    globals: false,
    environment: 'node',
  },
});
