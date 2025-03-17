import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import nodeExternals from "rollup-plugin-node-externals";
import transformPaths from "typescript-transform-paths";

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
  plugins: [
    typescript({
      transformers: {
        afterDeclarations: [
          {
            type: "program",
            factory: transformPaths.default ?? transformPaths,
          },
        ],
      },
    }),
    nodeExternals(),
  ],
});
