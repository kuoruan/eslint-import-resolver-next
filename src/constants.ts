import type { NapiResolveOptions } from "oxc-resolver";

import type { Options, PackageGlobOptions } from "./types";

export const defaultPackagesOptions = {
  ignore: ["**/node_modules/**", "**/test/**", "**/tests/**"],
  includeRoot: false,
  patterns: ["."],
} satisfies PackageGlobOptions;

/**
 * Copy from https://github.com/9romise/eslint-import-resolver-oxc/blob/main/src/normalizeOptions.ts
 */
export const defaultOptions = {
  aliasFields: [["browser"]],
  conditionNames: [
    "types",
    "import",

    // APF: https://angular.io/guide/angular-package-format
    "esm2020",
    "es2020",
    "es2015",

    "require",
    "node",
    "node-addons",
    "browser",
    "default",
  ],
  extensionAlias: {
    ".js": [
      ".ts",
      // `.tsx` can also be compiled as `.js`
      ".tsx",
      ".d.ts",
      ".js",
    ],
    ".jsx": [".tsx", ".d.ts", ".jsx"],
    ".cjs": [".cts", ".d.cts", ".cjs"],
    ".mjs": [".mts", ".d.mts", ".mjs"],
  },
  extensions: [".ts", ".tsx", ".d.ts", ".js", ".jsx", ".json", ".node"],
  mainFields: [
    "types",
    "typings",

    // APF: https://angular.io/guide/angular-package-format
    "fesm2020",
    "fesm2015",
    "esm2020",
    "es2020",

    "module",
    "jsnext:main",

    "main",
    "browser",
  ],

  tsconfig: false,
  jsconfig: "auto",
} satisfies Options;

export const defaultTsconfigOptions = {
  references: "auto",
} satisfies Partial<NapiResolveOptions["tsconfig"]>;

export const PNPM_WORKSPACE_FILENAME = "pnpm-workspace.yaml";

export const JSCONFIG_FILENAME = "jsconfig.json";

export const TSCONFIG_FILENAME = "tsconfig.json";
