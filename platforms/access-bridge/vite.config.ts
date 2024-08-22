import path from 'path';

import { defineConfig, loadEnv } from 'vite';
import type { ConfigEnv, UserConfigExport } from 'vitest/config';

export default ({ mode, command }: ConfigEnv): UserConfigExport => {
  const envPrefix = 'APP_';
  const env = loadEnv(mode, process.cwd(), envPrefix);

  // Shorten default mode names to dev / prod
  // Also differentiates from build type (production / development)
  mode = mode === 'development' ? 'dev' : mode;
  mode = mode === 'production' ? 'prod' : mode;

  // Make sure to builds are always production type,
  // otherwise modes other than 'production' get built in dev
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }

  return defineConfig({
    define: {
      'process.env': {
        APP_BIND_PORT: env.APP_BIND_PORT,
        APP_BIND_ADDR: env.APP_BIND_ADDR,
        APP_API_SECRET: env.APP_API_SECRET,
        APP_STRIPE_SECRET: env.APP_STRIPE_SECRET,
        APP_ACCESS_CONTROL_API_HOST: env.APP_ACCESS_CONTROL_API_HOST,
        APP_SIMS_API_HOST: env.APP_SIMS_API_HOST,
      },
    },
    envPrefix,
    server: {
      port: 3000,
    },
    build: {
      outDir: 'build',
      rollupOptions: {
        input: 'src/main.ts',
        output: {
          format: 'esm',
          entryFileNames: 'main.js',
          dir: 'build',
        },
        external: ['http', 'https', 'path', 'jsonwebtoken', 'express'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    test: {
      globals: true,
      include: ['**/*.test.ts'],
      chaiConfig: {
        // Prevent truncation of detailed test descriptions.
        truncateThreshold: 1000,
      },
    },
  });
};
