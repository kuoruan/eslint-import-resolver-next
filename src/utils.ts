import fastGlob from "fast-glob";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";

import {
  defaultConfigFileOptions,
  defaultPackagesOptions,
  PNPM_WORKSPACE_FILENAME,
  TSCONFIG_FILENAME,
} from "./constants";
import type {
  ConfigFileOptions,
  PackageGlobOptions,
  PackageOptions,
} from "./types";

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
  const normalizedPatterns: string[] = [];
  for (const pattern of patterns) {
    const convertedPattern = pattern.replace(/\\/g, "/").replace(/\/$/, "");

    // We should add separate pattern for each extension
    // for some reason, fast-glob is buggy with /package.{json,yaml,json5} pattern
    normalizedPatterns.push(
      convertedPattern + "/package.json",
      convertedPattern + "/package.json5",
      convertedPattern + "/package.yaml",
    );
  }
  return normalizedPatterns;
}

/**
 *
 * Copy from https://github.com/pnpm/pnpm/blob/19d5b51558716025b9c32af16abcaa009421f835/fs/find-packages/src/index.ts
 *
 * @param root
 * @param opts
 * @returns
 */
export function findPackages(
  root: string,
  opts?: PackageGlobOptions,
): string[] {
  const { patterns, includeRoot, ignore } = {
    ...defaultPackagesOptions,
    ...opts,
  };

  const normalizedPatterns = normalizePatterns(
    patterns ?? defaultPackagesOptions.patterns,
  );
  if (includeRoot) {
    normalizedPatterns.push(...normalizePatterns(["."]));
  }

  if (!normalizedPatterns.length) {
    return [];
  }

  const paths = fastGlob.globSync(normalizedPatterns, {
    cwd: fastGlob.convertPathToPattern(root),
    ignore,
  });

  return unique(
    paths.map((manifestPath) => path.join(root, path.dirname(manifestPath))),
  );
}

/**
 * Sort paths by the depth of the path. The deeper the path, the higher the priority.
 *
 * @param paths - the paths to sort
 * @returns
 */
export function sortPaths(paths: string[]): string[] {
  const pathDepths = new Map<string, number>();

  const getPathDepth = (p: string): number => {
    if (!p) return 0;

    if (pathDepths.has(p)) {
      return pathDepths.get(p)!;
    }

    const depth = p.split(path.sep).filter(Boolean).length;
    pathDepths.set(p, depth);

    return depth;
  };

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

export function readYamlFile<T>(filePath: string): T | null {
  let doc: T | null;
  try {
    doc = yaml.load(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    // ignore

    doc = null;
  }

  return doc;
}

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

    if (fs.existsSync(pnpmWorkspacePath)) {
      const pnpmWorkspace =
        readYamlFile<Record<"packages", string[]>>(pnpmWorkspacePath);

      if (pnpmWorkspace?.packages?.length) {
        packagePatterns = pnpmWorkspace.packages;
      }
    }
  }

  if (patterns) {
    packagePatterns = packagePatterns
      ? [...packagePatterns, ...patterns]
      : patterns;
  }

  return {
    patterns: packagePatterns ? unique(packagePatterns) : undefined,
    ...restOptions,
  };
}

export function findClosestPackageRoot(
  sourceFile: string,
  paths: string[],
): string | undefined {
  return sortPaths(paths).find((p) => sourceFile.startsWith(p));
}

export function findClosestConfigFile(
  sourceFile: string,
  configFiles: string[],
): string | undefined {
  return sortPaths(configFiles).find((p) =>
    sourceFile.startsWith(path.dirname(p)),
  );
}

const configCache = new Map<string, string[]>();

export function normalizeConfigFileOptions(
  config: boolean | string | ConfigFileOptions | undefined,
  packageDir: string,
  sourceFile: string,
  defaultFilename = TSCONFIG_FILENAME,
): ConfigFileOptions | undefined {
  if (!config) return undefined;

  if (typeof config === "object") {
    return { ...defaultConfigFileOptions, ...config };
  }

  const filename =
    typeof config === "string" ? path.basename(config) : defaultFilename;

  const cacheKey = `${packageDir}:${filename}`;

  let configFiles: string[];
  if (configCache.has(cacheKey)) {
    configFiles = configCache.get(cacheKey)!;
  } else {
    configFiles = fastGlob.globSync(`**/${filename}`, {
      cwd: fastGlob.convertPathToPattern(packageDir),
      ignore: ["**/node_modules/**"],
      absolute: true,
    });

    configCache.set(cacheKey, configFiles);
  }

  if (!configFiles.length) {
    return undefined;
  }

  const closestConfigPath = findClosestConfigFile(sourceFile, configFiles);

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

  return Object.keys(alias).reduce(
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
}
