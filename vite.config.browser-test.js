import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "tests/components.tsx"),
      name: "test-bundle-react",
      // the proper extensions will be added
      fileName: "test-bundle-react",
    },
    emptyOutDir: false,
  },
  define: {
    "process.env.NODE_ENV": "'production'",
  },
});
