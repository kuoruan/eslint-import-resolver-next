import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import yaml from "js-yaml";
import type { TsconfigOptions } from "oxc-resolver";
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
 * @param {T[]} arr - the array to remove duplicates from
 *
 * @returns {T[]} the array without duplicates
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
 * @param {string} modulePath - the import module path
 *
 * @returns {string} cleaned module path
 */
export function cleanModulePath(modulePath: string) {
  let cleanedPath = modulePath;

  if (cleanedPath.startsWith("node:")) {
    cleanedPath = modulePath.slice(5);
  }

  const querystringIndex = cleanedPath.lastIndexOf("?");

  if (querystringIndex > -1) {
    return cleanedPath.slice(0, querystringIndex);
  }

  return cleanedPath;
}

/**
 * Normalize patterns to include all possible package descriptor files.
 *
 * @param {string[]} patterns - the patterns to normalize
 *
 * @returns {string[]} the normalized patterns
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
 * @param {string} p - the path
 *
 * @returns {number} the depth of the path
 */
export function getPathDepth(p: string): number {
  if (!p || p === path.sep) return 0;

  // if the path is windows absolute path, we need to remove the drive letter
  if (path.isAbsolute(p) && /^[a-zA-Z]:[/\\]/.test(p)) {
    p = p.slice(2);
  }

  return p.split(path.sep).filter(Boolean).length;
}

/**
 * Sort paths by the depth of the path. The deeper the path, the higher the priority.
 *
 * @param {string[]} paths - the paths to sort
 *
 * @returns {string[]} the sorted paths
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
 * @param {string} filePath - the file path to read
 *
 * @returns {T | null} the parsed yaml file
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

    if (doc === undefined) {
      doc = null;
    }
  } catch {
    doc = null;
  }

  setYamlCache(filePath, doc);

  return doc;
}

/**
 * Normalize package glob options.
 *
 * @param {PackageOptions | string[]} opts - the package options
 * @param {string} root - the root path
 *
 * @returns {PackageGlobOptions} the normalized package glob options
 */
export function normalizePackageGlobOptions(
  opts: PackageOptions | string[],
  root: string,
): PackageGlobOptions {
  const { pnpmWorkspace, patterns, ...restOptions } = Array.isArray(opts)
    ? ({ patterns: opts } satisfies PackageOptions)
    : opts;

  let mergedPatterns: string[] = [];

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
      mergedPatterns.push(...pnpmWorkspaceRes.packages);
    }
  }

  if (patterns) {
    // the patterns in the options have higher priority
    mergedPatterns.push(...patterns);
  }

  mergedPatterns = unique(mergedPatterns.filter(Boolean));

  if (mergedPatterns.length) {
    return {
      patterns: mergedPatterns,
      ...restOptions,
    };
  }

  // return the original options if no patterns are found
  return { patterns, ...restOptions };
}

/**
 * Find all packages in the root path.
 *
 * Copy from https://github.com/pnpm/pnpm/blob/b8b0c687f2e3403d07381822fe81c08478413916/fs/find-packages/src/index.ts
 *
 * @param {string} root - the root path
 * @param {PackageOptions | string[]} packageOpts - the package options
 *
 * @returns {string[]} the found package paths
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
 * @param {string} sourceFile - the source file
 * @param {string[]} sortedPaths - the paths to search
 *
 * @returns {string | undefined} the closest package root
 */
export function findClosestPackageRoot(
  sourceFile: string,
  sortedPaths: string[],
): string | undefined {
  return sortedPaths.find((p) => sourceFile.startsWith(p));
}

/**
 * Sort config files by depth and specific filename.
 *
 * @param {string[]} configFiles - the config files to sort
 * @param {string} tsconfigFilename - the TypeScript config filename
 *
 * @returns {string[]} the sorted config files
 */
export function sortConfigFiles(
  configFiles: string[],
  tsconfigFilename?: string,
): string[] {
  return configFiles.sort((a, b) => {
    const aDepth = getPathDepth(a);
    const bDepth = getPathDepth(b);

    if (aDepth !== bDepth) {
      return bDepth - aDepth;
    }

    // move tsconfig before jsconfig
    if (tsconfigFilename) {
      if (a.endsWith(tsconfigFilename)) return -1;
      if (b.endsWith(tsconfigFilename)) return 1;
    }

    return b.localeCompare(a);
  });
}

/**
 * Find the closest config file from the source file.
 *
 * @param {string} sourceFile - the source file
 * @param {string[]} sortedConfigFiles - the config files to search
 *
 * @returns {string | undefined} the closest config file
 */
export function findClosestConfigFile(
  sourceFile: string,
  sortedConfigFiles: string[],
): string | undefined {
  return sortedConfigFiles.find((p) => sourceFile.startsWith(path.dirname(p)));
}

/**
 * Get the config files in the specified directory.
 *
 * @param {boolean | string | ConfigFileOptions | undefined} config - the config option
 * @param {string} root - the root path
 * @param {{ ignore?: string[]; filename: string }} defaults - the default options
 *
 * @returns {[string | undefined, string[] | undefined]} the filename and config files
 */
export function getConfigFiles(
  config: boolean | string | ConfigFileOptions | undefined,
  root: string,
  defaults: { ignore?: string[]; filename: string },
):
  | [filename: undefined, configFiles: undefined]
  | [filename: string, configFiles: string[]] {
  // if the config is not set, return undefined
  if (!config) return [undefined, undefined];

  let filename: string;
  let ignore: string[] | undefined;

  if (typeof config === "object") {
    ignore = config.ignore ?? defaults.ignore;

    if (config.configFile) {
      if (path.isAbsolute(config.configFile)) {
        // if the config file is absolute, return the filename and the config file
        return [path.basename(config.configFile), [config.configFile]];
      } else {
        filename = path.basename(config.configFile);
      }
    } else {
      filename = defaults.filename;
    }
  } else if (typeof config === "string") {
    filename = path.basename(config);
    ignore = defaults.ignore;
  } else {
    // if the config is set to true, use the default filename
    filename = defaults.filename;
    ignore = defaults.ignore;
  }

  const globPaths = globSync(`**/${filename}`, {
    cwd: root,
    ignore,
    expandDirectories: false,
  });

  return [filename, globPaths.map((p) => path.join(root, p))];
}

/**
 * Normalize the config file options.
 *
 * @param {Record<"tsconfig" | "jsconfig", boolean | string | ConfigFileOptions | undefined>} configs - the config file options
 * @param {string} packageDir - the directory of the package
 * @param {string} sourceFile - the source file
 *
 * @returns {ConfigFileOptions | undefined} the normalized config file options
 */
export function normalizeConfigFileOptions(
  configs: Record<
    "tsconfig" | "jsconfig",
    boolean | string | ConfigFileOptions | undefined
  >,
  packageDir: string,
  sourceFile: string,
): TsconfigOptions | undefined {
  const { jsconfig, tsconfig } = configs;

  if (!tsconfig && !jsconfig) return undefined;

  const { ignore: defaultIgnore, ...restDefaultOptions } =
    defaultConfigFileOptions;

  let configFiles = getConfigFilesCache(packageDir);

  if (!configFiles) {
    const globFiles: string[] = [];

    const [tsconfigFilename, tsconfigFiles] = getConfigFiles(
      tsconfig,
      packageDir,
      { ignore: defaultIgnore, filename: TSCONFIG_FILENAME },
    );

    if (tsconfigFiles) {
      globFiles.push(...tsconfigFiles);
    }

    const [, jsconfigFiles] = getConfigFiles(jsconfig, packageDir, {
      ignore: defaultIgnore,
      filename: JSCONFIG_FILENAME,
    });

    if (jsconfigFiles) {
      globFiles.push(...jsconfigFiles);
    }

    configFiles = sortConfigFiles(globFiles, tsconfigFilename);

    setConfigFilesCache(packageDir, configFiles);
  }

  if (!configFiles.length) {
    return undefined;
  }

  if (configFiles.length === 1) {
    return { ...restDefaultOptions, configFile: configFiles[0] };
  }

  const closestConfigPath = findClosestConfigFile(sourceFile, configFiles);

  if (closestConfigPath) {
    return { ...restDefaultOptions, configFile: closestConfigPath };
  }

  return undefined;
}

/**
 * Normalize the alias mapping.
 *
 * @param {Record<string, string | string[]> | undefined} alias - the alias mapping
 * @param {string} parent - the parent directory
 *
 * @returns {Record<string, string[]> | undefined} the normalized alias mapping
 */
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
 * @param {unknown} obj - the object to hash
 *
 * @returns {string} the hash of the object
 */
export function hashObject(obj: unknown): string {
  return crypto.createHash("sha256").update(stableHash(obj)).digest("hex");
}

/**
 * Find all workspace packages.
 *
 * @param {string[]} roots - the roots to search
 * @param {string[] | PackageOptions} packages - the package options
 *
 * @returns {string[]} the sorted workspace packages
 */
export function findWorkspacePackages(
  roots: string[],
  packages?: string[] | PackageOptions,
): string[] {
  if (packages && typeof packages === "object") {
    const find = roots.flatMap((r) => findAllPackages(r, packages));

    return sortPathsByDepth(unique(find));
  }

  return sortPathsByDepth([...roots]);
}
