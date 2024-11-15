import { fileURLToPath } from "url";

/** @type {import("vitest/node").UserWorkspaceConfig} */
export default {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
      "@tests": fileURLToPath(new URL("tests", import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.{test,spec}.ts"],
  },
};
