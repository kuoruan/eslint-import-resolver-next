import type { ConfigFileOptions, Options, PackageOptions } from "./types.js";

export const defaultPackagesOptions = {
  patterns: ["."],
  ignore: [
    "**/node_modules/**",
    "**/bower_components/**",
    "**/test/**",
    "**/tests/**",
  ],
  includeRoot: false,
} satisfies PackageOptions;

export const defaultConfigFileOptions = {
  references: "auto",
  ignore: ["**/node_modules/**"],
} satisfies Partial<ConfigFileOptions>;

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

    ".ts": [".ts", ".d.ts", ".js"],
    ".tsx": [
      ".tsx",
      ".d.ts",
      ".jsx",
      // `.tsx` can also be compiled as `.js`
      ".js",
    ],
    ".cts": [".cts", ".d.cts", ".cjs"],
    ".mts": [".mts", ".d.mts", ".mjs"],
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

  tsconfig: true,
  jsconfig: true,

  bun: !!process.versions.bun,
} satisfies Options;

export const PNPM_WORKSPACE_FILENAME = "pnpm-workspace.yaml";

export const JSCONFIG_FILENAME = "jsconfig.json";

export const TSCONFIG_FILENAME = "tsconfig.json";
