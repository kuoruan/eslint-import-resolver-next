import fastGlob from "fast-glob";
import fs from "fs";
import { getTsconfig, type TsConfigResult } from "get-tsconfig";
import yaml from "js-yaml";
import type { NapiResolveOptions } from "oxc-resolver";
import path from "path";

import {
  defaultPackagesOptions,
  defaultTsconfigOptions,
  JSCONFIG_FILENAME,
  PNPM_WORKSPACE_FILENAME,
  TSCONFIG_FILENAME,
} from "./constants";
import type { PackageGlobOptions, PackageOptions } from "./types";

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
    // We should add separate pattern for each extension
    // for some reason, fast-glob is buggy with /package.{json,yaml,json5} pattern
    normalizedPatterns.push(
      pattern.replace(/\/?$/, "/package.json"),
      pattern.replace(/\/?$/, "/package.json5"),
      pattern.replace(/\/?$/, "/package.yaml"),
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

  const normalizedPatterns = normalizePatterns(patterns);
  if (includeRoot) {
    normalizedPatterns.push(...normalizePatterns(["."]));
  }

  const paths = fastGlob.sync(normalizedPatterns, { cwd: root, ignore });

  return Array.from(
    new Set(
      paths.map((manifestPath) => path.join(root, path.dirname(manifestPath))),
    ),
  );
}

/**
 * Sort paths by the depth of the path. The deeper the path, the higher the priority.
 *
 * @param paths - the paths to sort
 * @returns
 */
export function sortPaths(paths: string[]): string[] {
  return paths.sort(
    (a, b) => b.split(path.sep).length - a.split(path.sep).length,
  );
}

export function readYamlFile<T>(filePath: string): T {
  return yaml.load(filePath) as T;
}

export function normalizePackageGlobOptions(
  { pnpmWorkspace, patterns, ...restOptions }: PackageOptions,
  root: string,
): PackageGlobOptions {
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

      if (pnpmWorkspace.packages && pnpmWorkspace.packages.length > 0) {
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
    patterns: packagePatterns
      ? Array.from(new Set(packagePatterns))
      : undefined,
    ...restOptions,
  };
}

export function findClosestPackageRoot(
  sourceFile: string,
  paths: string[],
): string | undefined {
  return sortPaths(paths).find((p) => sourceFile.startsWith(p));
}

const configCache = new Map();

export function getConfigFilename(
  root: string,
  sourceFile: string,
  filename: string,
): string | null {
  const configPath = path.join(root, filename);

  if (fs.existsSync(configPath)) {
    return configPath;
  }

  const configRes = getTsconfig(
    sourceFile,
    path.basename(filename),
    configCache,
  );
  if (configRes?.path) {
    return configRes.path;
  }

  return null;
}

export function normalizeTsconfigOptions(
  root: string,
  sourceFile: string,
  tsconfig?: boolean | string | NapiResolveOptions["tsconfig"],
): NapiResolveOptions["tsconfig"] | undefined {
  if (typeof tsconfig === "object") {
    return { ...defaultTsconfigOptions, ...tsconfig };
  }

  if (!tsconfig) return undefined;

  let tsconfigFilename: string | undefined;

  const tsconfigPath = path.join(
    root,
    typeof tsconfig === "string" ? tsconfig : TSCONFIG_FILENAME,
  );

  if (fs.existsSync(tsconfigPath)) {
    tsconfigFilename = tsconfigPath;
  } else {
    const tsconfigRes = getTsconfig(
      path.dirname(sourceFile),
      path.basename(tsconfigPath),
      configCache,
    );

    if (tsconfigRes?.path) {
      tsconfigFilename = tsconfigRes.path;
    }
  }

  return tsconfigFilename
    ? { ...defaultTsconfigOptions, configFile: tsconfigFilename }
    : undefined;
}

export function getJsconfigPaths(
  root: string,
  sourceFile: string,
  jsconfig: boolean | string,
): Record<string, string[]> | undefined {
  if (!jsconfig) return undefined;

  const jsconfigPath = path.join(
    root,
    typeof jsconfig === "string" ? jsconfig : JSCONFIG_FILENAME,
  );

  let jsconfigRes: TsConfigResult | null;
  if (fs.existsSync(jsconfigPath)) {
    jsconfigRes = getTsconfig(jsconfigPath);
  } else {
    jsconfigRes = getTsconfig(
      path.dirname(sourceFile),
      path.basename(jsconfigPath),
      configCache,
    );
  }

  if (jsconfigRes?.config?.compilerOptions?.paths) {
    return jsconfigRes.config.compilerOptions.paths;
  }

  return undefined;
}

export function normalizeAlias(
  alias?: Record<string, string | string[]>,
): Record<string, string[]> | undefined {
  if (!alias) return undefined;

  return Object.keys(alias).reduce(
    (acc, key) => {
      const value = alias[key];

      if (!Array.isArray(value)) {
        acc[key] = [value];
      }
      return acc;
    },
    {} as Record<string, string[]>,
  );
}
