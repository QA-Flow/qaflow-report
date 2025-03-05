import { defineConfig } from "tsup";
import { resolve } from "path";

export default defineConfig({
  entry: [resolve(__dirname, "src/index.ts")],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
});