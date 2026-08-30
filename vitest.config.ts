import { defineConfig } from 'vitest/config';

// The worker directory has its own Vitest config and needs the Cloudflare
// Workers pool, so it is excluded here and run separately from worker/.
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', 'worker/**'],
  },
});
