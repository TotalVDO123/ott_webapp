import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import type { UserConfigExport } from 'vitest/config';

export default (): UserConfigExport => {
  // Include Vite Node plugin for Node.js support
  return defineConfig({
    plugins: [
      ...VitePluginNode({
        adapter: 'express',
        appPath: 'src/main.ts',
        tsCompiler: 'esbuild',
      }),
    ],
    build: {
      outDir: 'build',
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
