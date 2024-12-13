import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import nodeExternals from "rollup-plugin-node-externals";

export default defineConfig({
  input: "src/index.ts",
  output: [
    {
      dir: "lib",
      format: "cjs",
      entryFileNames: "[name].cjs",
      exports: "named",
    },
    {
      dir: "lib",
      format: "es",
      entryFileNames: "[name].js",
    },
  ],
  plugins: [typescript(), nodeExternals()],
});
