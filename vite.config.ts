import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

const isDependency = (id: string) =>
  id.startsWith("@topsort/sdk") ||
  (!id.startsWith(".") && !id.startsWith("/") && !id.includes(":") && !id.startsWith("\0"));

export default defineConfig(({ mode }) => {
  const isIIFE = mode === "iife";

  return {
    root: ".",
    build: {
      lib: {
        entry: resolve(__dirname, "src/detector.ts"),
        name: "ts",
        formats: isIIFE ? ["iife"] : ["es", "umd"],
        fileName: (format) =>
          format === "iife" ? "ts.iife.js" : `ts.${format === "es" ? "mjs" : "js"}`,
      },
      emptyOutDir: !isIIFE,
      rollupOptions: {
        external: isIIFE ? [] : isDependency,
      },
    },
    plugins: [
      dts({
        exclude: ["./vite.config.ts", "tests/**/*", "mocks/**/*", "**/*.test.ts", "**/*.test.tsx"],
        afterBuild: () => {
          copyFileSync("src/index.d.ts", "dist/src/index.d.ts");
        },
      }),
    ],
    test: {
      environment: "jsdom",
      environmentOptions: {
        jsdom: {
          url: "http://localhost",
        },
      },
      execArgv: ["--no-experimental-webstorage"],
    },
  };
});
