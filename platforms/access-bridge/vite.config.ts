import { defineConfig, loadEnv, PluginOption } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import type { ConfigEnv, UserConfigExport } from 'vitest/config';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default ({ mode, command }: ConfigEnv): UserConfigExport => {
  const envPrefix = 'APP_';
  const env = loadEnv(mode, process.cwd(), envPrefix);

  // Shorten default mode names to dev / prod
  mode = mode === 'development' ? 'dev' : mode;
  mode = mode === 'production' ? 'prod' : mode;

  // Ensure builds are always production type
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }

  // Define the initial plugins array with the Vite Node plugin for Node.js support
  const plugins: PluginOption[] = [
    VitePluginNode({
      adapter: 'express',
      appPath: 'src/main.ts',
      tsCompiler: 'esbuild',
    }),
  ];

  // Conditionally add the Sentry plugin based on the mode and presence of Sentry-related env variables
  if (mode === 'prod' && env.APP_SENTRY_DSN && env.APP_SENTRY_AUTH_TOKEN) {
    plugins.push(
      sentryVitePlugin({
        authToken: env.APP_SENTRY_AUTH_TOKEN,
        org: env.APP_SENTRY_ORG_NAME,
        project: env.APP_SENTRY_PROJ_NAME,
      })
    );
  }

  return defineConfig({
    envPrefix,
    plugins,
    build: {
      outDir: 'build',
      sourcemap: true,
    },
    test: {
      globals: true,
      include: ['**/*.test.ts'],
      setupFiles: 'test/vitest.setup.ts',
      chaiConfig: {
        truncateThreshold: 1000,
      },
    },
  });
};
