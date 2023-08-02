import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/detector.ts"),
      name: "ts",
      fileName: (format) => `ts.${format === "es" ? "mjs" : format === "umd" ? "js" : "js"}`,
      formats: ["es", "umd"],
    },
    emptyOutDir: false,
  },
});
