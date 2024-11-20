import { builtinModules } from "module";
import { type NapiResolveOptions, ResolverFactory } from "oxc-resolver";
import path from "path";
import { cwd } from "process";

import {
  defaultOptions,
  JSCONFIG_FILENAME,
  TSCONFIG_FILENAME,
} from "./constants";
import type { ConfigFileOptions, Options, ResolvedResult } from "./types";
import {
  cleanModulePath,
  findClosestPackageRoot,
  findPackages,
  normalizeAlias,
  normalizeConfigFileOptions,
  normalizePackageGlobOptions,
  unique,
} from "./utils";

const root = cwd();

let resolverCache: ResolverFactory | null = null;

/**
 * Resolves relative path imports
 *
 * @param sourceFile - The file that imports the module
 * @param modulePath - The module path to resolve
 * @param options - The resolver options
 * @returns
 */
function resolveRelativePath(
  sourceFile: string,
  modulePath: string,
  options: NapiResolveOptions,
): ResolvedResult {
  if (!resolverCache) {
    resolverCache = new ResolverFactory(options);
  }

  const sourceFileDir = path.dirname(sourceFile);

  const result = resolverCache.sync(sourceFileDir, modulePath);

  if (result.path) {
    return { found: true, path: result.path };
  }

  return { found: false };
}

const pathToPackagesMap = new Map<string, string[]>();

export default function resolve(
  modulePath: string,
  sourceFile: string,
  config?: Options | null,
): ResolvedResult {
  const cleanedPath = cleanModulePath(modulePath);

  if (builtinModules.includes(cleanedPath)) {
    return { found: true, path: null };
  }

  // wrong node module path
  if (modulePath.startsWith("node:")) {
    return { found: false };
  }

  const { roots, alias, packages, jsconfig, tsconfig, ...restOptions } = {
    ...defaultOptions,
    ...config,
  };

  // relative path
  if (modulePath.startsWith(".")) {
    return resolveRelativePath(sourceFile, modulePath, restOptions);
  }

  let resolveRoots = roots?.length ? roots : [root];

  let packageDir: string | undefined;

  if (packages && typeof packages === "object") {
    for (const r of resolveRoots) {
      // find all packages in the root
      let paths = pathToPackagesMap.get(r);
      if (!paths) {
        paths = findPackages(r, normalizePackageGlobOptions(packages, r));

        pathToPackagesMap.set(r, paths);
      }

      if (!paths.length) continue;

      const filePackage = findClosestPackageRoot(sourceFile, paths);
      if (filePackage) {
        packageDir = filePackage;

        resolveRoots = unique([packageDir, ...resolveRoots]);

        break;
      }
    }
  } else {
    const findPackage = findClosestPackageRoot(sourceFile, resolveRoots);

    if (findPackage) {
      packageDir = findPackage;
    }
  }

  // file not find in any package
  if (!packageDir) {
    return { found: false };
  }

  const resolveAlias = normalizeAlias(alias, packageDir);

  let configFileOptions: ConfigFileOptions | undefined;

  for (const c of [
    { config: tsconfig, filename: TSCONFIG_FILENAME },
    { config: jsconfig, filename: JSCONFIG_FILENAME },
  ] as const) {
    configFileOptions = normalizeConfigFileOptions(
      c.config,
      packageDir,
      sourceFile,
      c.filename,
    );

    if (configFileOptions) {
      break;
    }
  }

  const resolver = new ResolverFactory({
    alias: resolveAlias,
    tsconfig: configFileOptions,
    roots: resolveRoots,
    ...restOptions,
  });

  const result = resolver.sync(path.dirname(sourceFile), modulePath);
  if (result.path) {
    return { found: true, path: result.path };
  }

  return { found: false };
}
