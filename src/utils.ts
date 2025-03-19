import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import yaml from "js-yaml";
import { stableHash } from "stable-hash";
import { globSync } from "tinyglobby";

import {
  getConfigFilesCache,
  getPackagesCache,
  getYamlCache,
  setConfigFilesCache,
  setPackagesCache,
  setYamlCache,
} from "./cache.js";
import {
  defaultConfigFileOptions,
  defaultPackagesOptions,
  JSCONFIG_FILENAME,
  NODE_MODULES_EXCLUDE,
  PNPM_WORKSPACE_FILENAME,
  TSCONFIG_FILENAME,
} from "./constants.js";
import type {
  ConfigFileOptions,
  PackageGlobOptions,
  PackageOptions,
} from "./types.js";

/**
 * Remove duplicates from an array.
 *
 * @param arr - the array to remove duplicates from
 * @returns
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Remove prefix and querystrings from the module path.
 * When using node: prefix, we should remove it.
 * Some imports may have querystrings, for example:
 *  * import "foo?bar";
 *
 * @param {string} modulePath the import module path
 *
 * @retures {string} cleaned source
 */
export function cleanModulePath(modulePath: string) {
  if (modulePath.startsWith("node:")) {
    return modulePath.slice(5);
  }

  const querystringIndex = modulePath.lastIndexOf("?");

  if (querystringIndex > -1) {
    return modulePath.slice(0, querystringIndex);
  }

  return modulePath;
}

/**
 * Normalize patterns to include all possible package descriptor files.
 *
 * @param patterns - the patterns to normalize
 * @returns the normalized patterns
 */
export function normalizePatterns(patterns: string[]): string[] {
  if (!patterns.length) return [];

  return patterns.flatMap((pattern) => {
    const convertedPattern = pattern.replace(/\\/g, "/").replace(/\/$/, "");

    // for some reason, fast-glob is buggy with /package.{json,yaml,json5} pattern
    return [
      `${convertedPattern}/package.json`,
      `${convertedPattern}/package.json5`,
      `${convertedPattern}/package.yaml`,
    ];
  });
}

/**
 * Get the depth of a path.
 *
 * @param p {string} - the path
 * @returns {number} - the depth of the path
 */
export function getPathDepth(p: string): number {
  if (!p) return 0;

  return p.split(path.sep).filter(Boolean).length;
}

/**
 * Sort paths by the depth of the path. The deeper the path, the higher the priority.
 *
 * @param paths - the paths to sort
 * @returns
 */
export function sortPathsByDepth(paths: string[]): string[] {
  return paths.sort((a, b) => {
    if (a === "/") return 1;
    if (b === "/") return -1;

    const aDepth = getPathDepth(a);
    const bDepth = getPathDepth(b);

    if (aDepth !== bDepth) {
      return bDepth - aDepth;
    }

    return b.localeCompare(a);
  });
}

/**
 * Read a yaml file.
 *
 * @param filePath {string} - the file path to read
 * @returns {T | null} - the parsed yaml file
 */
export function readYamlFile<T>(filePath: string): T | null {
  const cache = getYamlCache(filePath);
  if (cache) return cache as T;

  if (!fs.existsSync(filePath)) {
    return null;
  }

  let doc: T | null;
  try {
    doc = yaml.load(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    doc = null;
  }

  setYamlCache(filePath, doc);

  return doc;
}

/**
 * Normalize package glob options.
 *
 * @param opts {PackageOptions | string[]} - the package options
 * @param root {string} - the root path
 * @returns {PackageGlobOptions} - the normalized package glob options
 */
export function normalizePackageGlobOptions(
  opts: PackageOptions | string[],
  root: string,
): PackageGlobOptions {
  const { pnpmWorkspace, patterns, ...restOptions } = Array.isArray(opts)
    ? ({ patterns: opts } satisfies PackageOptions)
    : opts;

  let packagePatterns: string[] | undefined;

  if (pnpmWorkspace) {
    const pnpmWorkspacePath = path.join(
      root,
      typeof pnpmWorkspace === "string"
        ? pnpmWorkspace
        : PNPM_WORKSPACE_FILENAME,
    );

    const pnpmWorkspaceRes =
      readYamlFile<Record<"packages", string[]>>(pnpmWorkspacePath);

    if (pnpmWorkspaceRes?.packages?.length) {
      packagePatterns = pnpmWorkspaceRes.packages;
    }
  }

  if (patterns?.length) {
    const mergedPatterns = packagePatterns
      ? [...packagePatterns, ...patterns]
      : patterns;

    packagePatterns = mergedPatterns.filter(Boolean);
  }

  packagePatterns = unique(packagePatterns ?? []);

  if (packagePatterns.length) {
    return {
      patterns: packagePatterns,
      ...restOptions,
    };
  }

  return restOptions;
}

/**
 *
 * Copy from https://github.com/pnpm/pnpm/blob/b8b0c687f2e3403d07381822fe81c08478413916/fs/find-packages/src/index.ts
 *
 * @param root
 * @param opts
 * @returns
 */
export function findAllPackages(
  root: string,
  packageOpts: PackageOptions | string[],
): string[] {
  const cache = getPackagesCache(root);
  if (cache) return cache;

  const opts = normalizePackageGlobOptions(packageOpts, root);

  const { patterns, includeRoot, ignore } = {
    ...defaultPackagesOptions,
    ...opts,
  };

  const searchPatterns = patterns ?? defaultPackagesOptions.patterns;

  if (includeRoot) {
    searchPatterns.push(".");
  }

  const normalizedPatterns = normalizePatterns(searchPatterns);

  if (!normalizedPatterns.length) return [];

  const paths = globSync(normalizedPatterns, {
    cwd: root,
    ignore,
    expandDirectories: false,
  });

  const packagePaths = unique(
    paths.map((manifestPath) => path.join(root, path.dirname(manifestPath))),
  );

  setPackagesCache(root, packagePaths);

  return packagePaths;
}

/**
 * Find the closest package from the source file.
 *
 * @param sourceFile {string} - the source file
 * @param paths {string[]} - the paths to search
 * @returns {string | undefined} - the closest package root
 */
export function findClosestPackageRoot(
  sourceFile: string,
  paths: string[],
): string | undefined {
  return sortPathsByDepth(paths).find((p) => sourceFile.startsWith(p));
}

export function findClosestConfigFile(
  sourceFile: string,
  configFiles: string[],
  tsconfigFilename?: string,
): string | undefined {
  return configFiles
    .sort((a, b) => {
      const aDepth = getPathDepth(a);
      const bDepth = getPathDepth(b);

      if (aDepth !== bDepth) {
        return bDepth - aDepth;
      }

      if (tsconfigFilename) {
        if (a.endsWith(tsconfigFilename)) return -1;
        if (b.endsWith(tsconfigFilename)) return 1;
      }

      return b.localeCompare(a);
    })
    .find((p) => sourceFile.startsWith(path.dirname(p)));
}

export function getConfigFilename(
  config: boolean | string | ConfigFileOptions | undefined,
  defaultFilename: string,
): string | undefined {
  if (!config) return undefined;

  if (typeof config === "string") {
    return path.basename(config);
  }

  if (typeof config === "object" && config?.configFile) {
    return path.basename(config.configFile);
  }

  return defaultFilename;
}

export function normalizeConfigFileOptions(
  configs: Record<
    "tsconfig" | "jsconfig",
    boolean | string | ConfigFileOptions | undefined
  >,
  packageDir: string,
  sourceFile: string,
): ConfigFileOptions | undefined {
  const { jsconfig, tsconfig } = configs;

  if (!tsconfig && !jsconfig) return undefined;

  for (const c of [tsconfig, jsconfig] as const) {
    if (
      typeof c === "object" &&
      c.configFile &&
      path.isAbsolute(c.configFile)
    ) {
      return { ...defaultConfigFileOptions, ...c };
    }
  }

  const jsconfigFilename = getConfigFilename(jsconfig, JSCONFIG_FILENAME);
  const tsconfigFilename = getConfigFilename(tsconfig, TSCONFIG_FILENAME);

  let configFiles = getConfigFilesCache(packageDir);

  if (!configFiles) {
    const paths = globSync(
      [tsconfigFilename, jsconfigFilename]
        .filter(Boolean)
        .map((f) => `**/${f}`),
      {
        cwd: packageDir,
        ignore: [NODE_MODULES_EXCLUDE],
        expandDirectories: false,
      },
    );

    configFiles = paths.map((p) => path.join(packageDir, p));

    setConfigFilesCache(packageDir, configFiles);
  }

  if (!configFiles.length) {
    return undefined;
  }

  const closestConfigPath = findClosestConfigFile(
    sourceFile,
    configFiles,
    tsconfigFilename,
  );

  if (closestConfigPath) {
    return { ...defaultConfigFileOptions, configFile: closestConfigPath };
  }

  return undefined;
}

export function normalizeAlias(
  alias: Record<string, string | string[]> | undefined,
  parent: string,
): Record<string, string[]> | undefined {
  if (!alias) return undefined;

  const normalizedAlias = Object.keys(alias).reduce(
    (acc, key) => {
      const value = Array.isArray(alias[key]) ? alias[key] : [alias[key]];

      acc[key] = value.map((item) => {
        if (path.isAbsolute(item)) {
          return item;
        }

        return path.resolve(parent, item);
      });
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return normalizedAlias;
}

/**
 * Get the hash of an object.
 *
 * @param obj {unknown} - the object to hash
 * @returns - the hash of the object
 */
export function hashObject(obj: unknown): string {
  return crypto.createHash("sha256").update(stableHash(obj)).digest("hex");
}

/**
 * Find all workspace packages.
 *
 * @param roots {string[]} - the roots to search
 * @param packages {string[] | PackageOptions} - the package options
 * @returns {string[]} - the workspace packages
 */
export function findWorkspacePackages(
  roots: string[],
  packages?: string[] | PackageOptions,
): string[] {
  if (packages && typeof packages === "object") {
    return roots.flatMap((r) => findAllPackages(r, packages));
  }

  return [...roots];
}
