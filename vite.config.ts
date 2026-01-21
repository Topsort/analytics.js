import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

let currentFormat: string | undefined;

function formatSpecificExternal(): Plugin {
  return {
    name: "format-specific-external",
    buildStart() {
      currentFormat = undefined;
    },
    outputOptions(options) {
      currentFormat = options.format;
      return options;
    },
    options(options) {
      const originalExternal = options.external;
          
      options.external = (id, importer, isResolved) => {
        const isDependency =
          id.startsWith("@topsort/sdk") ||
          (!id.startsWith(".") && !id.startsWith("/") && !id.includes(":") && !id.startsWith("\0"));

        if (!isDependency) {
          return false;
        }

        if (currentFormat === "iife") {
          return false;
        }

        if (typeof originalExternal === "function") {
          return originalExternal(id, importer, isResolved);
        }
        return true;
      };
      return options;
    },
  };
}

export default defineConfig({
  root: ".",
  build: {
    lib: {
      entry: resolve(__dirname, "src/detector.ts"),
      name: "ts",
      formats: ["es", "umd", "iife"],
      fileName: (format) =>
        format === "iife" ? "ts.iife.js" : `ts.${format === "es" ? "mjs" : "js"}`,
    },
    emptyOutDir: true,
    rollupOptions: {
      external: (id) => {
        const isDependency =
          id.startsWith("@topsort/sdk") ||
          (!id.startsWith(".") && !id.startsWith("/") && !id.includes(":") && !id.startsWith("\0"));

        if (!isDependency) {
          return false;
        }

        return true;
      },
    },
  },
  plugins: [
    formatSpecificExternal(),
    dts({
      exclude: ["./vite.config.ts", "tests/**/*", "mocks/**/*", "**/*.test.ts", "**/*.test.tsx"],
      afterBuild: () => {
        copyFileSync("src/index.d.ts", "dist/src/index.d.ts");
      },
    }),
  ],
  test: {
    environment: "jsdom",
  },
});
