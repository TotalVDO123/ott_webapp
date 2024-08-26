import path from 'path';

import { defineConfig, loadEnv, PluginOption } from 'vite';
import type { ConfigEnv, UserConfigExport } from 'vitest/config';
import { sentryVitePlugin } from '@sentry/vite-plugin';

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

  // Define plugins
  const plugins: PluginOption[] | undefined = [];

  // Conditionally add the Sentry plugin if the necessary env variables are provided
  if (env.APP_SENTRY_DSN && env.APP_SENTRY_AUTH_TOKEN) {
    // Sentry vite plugin should be placed after all other plugins.
    // This plugin is needed allow sentry to provide readable stack traces.
    plugins.push(
      sentryVitePlugin({
        authToken: env.APP_SENTRY_AUTH_TOKEN,
        org: 'personal-r4t', // Sentry organization name
        project: 'node', // Sentry project name
      })
    );
  }

  return defineConfig({
    plugins,
    define: {
      'process.env': {
        APP_VERSION: env.APP_VERSION,
        APP_BIND_PORT: env.APP_BIND_PORT,
        APP_BIND_ADDR: env.APP_BIND_ADDR,
        APP_API_SECRET: env.APP_API_SECRET,
        APP_STRIPE_SECRET: env.APP_STRIPE_SECRET,
        APP_ACCESS_CONTROL_API_HOST: env.APP_ACCESS_CONTROL_API_HOST,
        APP_SIMS_API_HOST: env.APP_SIMS_API_HOST,
        APP_SENTRY_DSN: env.APP_SENTRY_DSN,
        APP_SENTRY_TRACE_RATE: env.APP_SENTRY_TRACE_RATE,
        APP_SENTRY_AUTH_TOKEN: env.APP_SENTRY_AUTH_TOKEN,
      },
    },
    envPrefix,
    server: {
      port: 3000,
    },
    build: {
      outDir: 'build',
      sourcemap: true,
      rollupOptions: {
        input: {
          main: 'src/main.ts',
          instrument: './instrument.mjs',
        },
        output: {
          format: 'esm',
          dir: 'build',
          // Customize the output file names
          entryFileNames: (chunk) => {
            return chunk.name === 'instrument' ? 'instrument.js' : 'main.js';
          },
        },
        external: ['http', 'https', 'path', 'jsonwebtoken', 'express', '@sentry/node', '@sentry/profiling-node'],
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
      setupFiles: 'test/vitest.setup.ts',
      chaiConfig: {
        // Prevent truncation of detailed test descriptions.
        truncateThreshold: 1000,
      },
    },
  });
};
