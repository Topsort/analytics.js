import { resolve } from "path";
import type { UserConfig } from "vite";
import dts from "vite-plugin-dts";
import type { UserConfig as VitestConfig } from "vitest";

export default {
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
} satisfies UserConfig & { test: VitestConfig };
