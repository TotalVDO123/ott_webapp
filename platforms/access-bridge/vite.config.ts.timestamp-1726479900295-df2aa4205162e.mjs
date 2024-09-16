// vite.config.ts
import { defineConfig, loadEnv } from "file:///Users/kire.mitrov/projects/jw/ott-web-app/node_modules/vite/dist/node/index.js";
import { VitePluginNode } from "file:///Users/kire.mitrov/projects/jw/ott-web-app/node_modules/vite-plugin-node/dist/index.js";
import { sentryVitePlugin } from "file:///Users/kire.mitrov/projects/jw/ott-web-app/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
var vite_config_default = ({ mode, command }) => {
  const envPrefix = "APP_";
  const env = loadEnv(mode, process.cwd(), envPrefix);
  mode = mode === "development" ? "dev" : mode;
  mode = mode === "production" ? "prod" : mode;
  if (command === "build") {
    process.env.NODE_ENV = "production";
  }
  const plugins = [
    VitePluginNode({
      adapter: "express",
      appPath: "src/main.ts",
      tsCompiler: "esbuild"
    })
  ];
  if (mode === "prod" && env.APP_SENTRY_DSN && env.APP_SENTRY_AUTH_TOKEN) {
    plugins.push(
      sentryVitePlugin({
        authToken: env.APP_SENTRY_AUTH_TOKEN,
        org: env.APP_SENTRY_ORG_NAME,
        project: env.APP_SENTRY_PROJ_NAME
      })
    );
  }
  return defineConfig({
    server: {
      port: parseInt(env.APP_BIND_PORT)
    },
    envPrefix,
    plugins,
    build: {
      outDir: "build",
      sourcemap: true
    },
    test: {
      globals: true,
      include: ["**/*.test.ts"],
      setupFiles: "test/vitest.setup.ts",
      chaiConfig: {
        truncateThreshold: 1e3
      }
    }
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMva2lyZS5taXRyb3YvcHJvamVjdHMvancvb3R0LXdlYi1hcHAvcGxhdGZvcm1zL2FjY2Vzcy1icmlkZ2VcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9raXJlLm1pdHJvdi9wcm9qZWN0cy9qdy9vdHQtd2ViLWFwcC9wbGF0Zm9ybXMvYWNjZXNzLWJyaWRnZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMva2lyZS5taXRyb3YvcHJvamVjdHMvancvb3R0LXdlYi1hcHAvcGxhdGZvcm1zL2FjY2Vzcy1icmlkZ2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYsIFBsdWdpbk9wdGlvbiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHsgVml0ZVBsdWdpbk5vZGUgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlJztcbmltcG9ydCB0eXBlIHsgQ29uZmlnRW52LCBVc2VyQ29uZmlnRXhwb3J0IH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XG5pbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSAnQHNlbnRyeS92aXRlLXBsdWdpbic7XG5cbmV4cG9ydCBkZWZhdWx0ICh7IG1vZGUsIGNvbW1hbmQgfTogQ29uZmlnRW52KTogVXNlckNvbmZpZ0V4cG9ydCA9PiB7XG4gIGNvbnN0IGVudlByZWZpeCA9ICdBUFBfJztcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCBlbnZQcmVmaXgpO1xuXG4gIC8vIFNob3J0ZW4gZGVmYXVsdCBtb2RlIG5hbWVzIHRvIGRldiAvIHByb2RcbiAgbW9kZSA9IG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyAnZGV2JyA6IG1vZGU7XG4gIG1vZGUgPSBtb2RlID09PSAncHJvZHVjdGlvbicgPyAncHJvZCcgOiBtb2RlO1xuXG4gIC8vIEVuc3VyZSBidWlsZHMgYXJlIGFsd2F5cyBwcm9kdWN0aW9uIHR5cGVcbiAgaWYgKGNvbW1hbmQgPT09ICdidWlsZCcpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJztcbiAgfVxuXG4gIC8vIERlZmluZSB0aGUgaW5pdGlhbCBwbHVnaW5zIGFycmF5IHdpdGggdGhlIFZpdGUgTm9kZSBwbHVnaW4gZm9yIE5vZGUuanMgc3VwcG9ydFxuICBjb25zdCBwbHVnaW5zOiBQbHVnaW5PcHRpb25bXSA9IFtcbiAgICBWaXRlUGx1Z2luTm9kZSh7XG4gICAgICBhZGFwdGVyOiAnZXhwcmVzcycsXG4gICAgICBhcHBQYXRoOiAnc3JjL21haW4udHMnLFxuICAgICAgdHNDb21waWxlcjogJ2VzYnVpbGQnLFxuICAgIH0pLFxuICBdO1xuXG4gIC8vIENvbmRpdGlvbmFsbHkgYWRkIHRoZSBTZW50cnkgcGx1Z2luIGJhc2VkIG9uIHRoZSBtb2RlIGFuZCBwcmVzZW5jZSBvZiBTZW50cnktcmVsYXRlZCBlbnYgdmFyaWFibGVzXG4gIGlmIChtb2RlID09PSAncHJvZCcgJiYgZW52LkFQUF9TRU5UUllfRFNOICYmIGVudi5BUFBfU0VOVFJZX0FVVEhfVE9LRU4pIHtcbiAgICBwbHVnaW5zLnB1c2goXG4gICAgICBzZW50cnlWaXRlUGx1Z2luKHtcbiAgICAgICAgYXV0aFRva2VuOiBlbnYuQVBQX1NFTlRSWV9BVVRIX1RPS0VOLFxuICAgICAgICBvcmc6IGVudi5BUFBfU0VOVFJZX09SR19OQU1FLFxuICAgICAgICBwcm9qZWN0OiBlbnYuQVBQX1NFTlRSWV9QUk9KX05BTUUsXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICByZXR1cm4gZGVmaW5lQ29uZmlnKHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IHBhcnNlSW50KGVudi5BUFBfQklORF9QT1JUKSxcbiAgICB9LFxuICAgIGVudlByZWZpeCxcbiAgICBwbHVnaW5zLFxuICAgIGJ1aWxkOiB7XG4gICAgICBvdXREaXI6ICdidWlsZCcsXG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgfSxcbiAgICB0ZXN0OiB7XG4gICAgICBnbG9iYWxzOiB0cnVlLFxuICAgICAgaW5jbHVkZTogWycqKi8qLnRlc3QudHMnXSxcbiAgICAgIHNldHVwRmlsZXM6ICd0ZXN0L3ZpdGVzdC5zZXR1cC50cycsXG4gICAgICBjaGFpQ29uZmlnOiB7XG4gICAgICAgIHRydW5jYXRlVGhyZXNob2xkOiAxMDAwLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdYLFNBQVMsY0FBYyxlQUE2QjtBQUM1YSxTQUFTLHNCQUFzQjtBQUUvQixTQUFTLHdCQUF3QjtBQUVqQyxJQUFPLHNCQUFRLENBQUMsRUFBRSxNQUFNLFFBQVEsTUFBbUM7QUFDakUsUUFBTSxZQUFZO0FBQ2xCLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsU0FBUztBQUdsRCxTQUFPLFNBQVMsZ0JBQWdCLFFBQVE7QUFDeEMsU0FBTyxTQUFTLGVBQWUsU0FBUztBQUd4QyxNQUFJLFlBQVksU0FBUztBQUN2QixZQUFRLElBQUksV0FBVztBQUFBLEVBQ3pCO0FBR0EsUUFBTSxVQUEwQjtBQUFBLElBQzlCLGVBQWU7QUFBQSxNQUNiLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxNQUNULFlBQVk7QUFBQSxJQUNkLENBQUM7QUFBQSxFQUNIO0FBR0EsTUFBSSxTQUFTLFVBQVUsSUFBSSxrQkFBa0IsSUFBSSx1QkFBdUI7QUFDdEUsWUFBUTtBQUFBLE1BQ04saUJBQWlCO0FBQUEsUUFDZixXQUFXLElBQUk7QUFBQSxRQUNmLEtBQUssSUFBSTtBQUFBLFFBQ1QsU0FBUyxJQUFJO0FBQUEsTUFDZixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFFQSxTQUFPLGFBQWE7QUFBQSxJQUNsQixRQUFRO0FBQUEsTUFDTixNQUFNLFNBQVMsSUFBSSxhQUFhO0FBQUEsSUFDbEM7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLElBQ2I7QUFBQSxJQUNBLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULFNBQVMsQ0FBQyxjQUFjO0FBQUEsTUFDeEIsWUFBWTtBQUFBLE1BQ1osWUFBWTtBQUFBLFFBQ1YsbUJBQW1CO0FBQUEsTUFDckI7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbXQp9Cg==
