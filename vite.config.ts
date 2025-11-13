import { resolve } from "path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/detector.ts"),
      name: "ts",
      fileName: (format) => `ts.${format === "es" ? "mjs" : format === "umd" ? "js" : "js"}`,
      formats: ["es", "umd"],
    },
    emptyOutDir: true,
  },
  plugins: [
    dts({
      exclude: ["./vite.config.ts", "tests/**/*", "mocks/**/*"],
    }),
  ],
  test: {
    environment: "jsdom",
  },
});
