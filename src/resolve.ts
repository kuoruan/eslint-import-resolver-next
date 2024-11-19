import { builtinModules } from "module";
import { ResolverFactory } from "oxc-resolver";
import path from "path";
import { cwd } from "process";

import {
  defaultOptions,
  JSCONFIG_FILENAME,
  TSCONFIG_FILENAME,
} from "./constants";
import type { Options, ResolvedResult } from "./types";
import {
  cleanModulePath,
  findClosestPackageRoot,
  findPackages,
  normalizeAlias,
  normalizeConfigFileOptions,
  normalizePackageGlobOptions,
  unique,
} from "./utils";

const processCwd = cwd();

const pathToPackagesMap = new Map<string, string[]>();
let resolverCache: ResolverFactory | null = null;

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

  const sourceFileDir = path.dirname(sourceFile);

  // relative path
  if (modulePath.startsWith(".")) {
    if (!resolverCache) {
      resolverCache = new ResolverFactory(restOptions);
    }

    const result = resolverCache.sync(sourceFileDir, modulePath);

    if (result.path) {
      return { found: true, path: result.path };
    }

    return { found: false };
  }

  let resolveRoots = roots?.length ? roots : [processCwd];

  let sourceFilePackage: string | undefined;

  if (typeof packages === "object") {
    for (const r of resolveRoots) {
      // find all packages in the root
      let paths = pathToPackagesMap.get(r);
      if (!paths) {
        const globOptions = normalizePackageGlobOptions(packages, r);
        paths = findPackages(r, globOptions);

        pathToPackagesMap.set(r, paths);
      }

      if (!paths.length) continue;

      const filePackage = findClosestPackageRoot(sourceFile, paths);
      if (filePackage) {
        sourceFilePackage = filePackage;

        resolveRoots = unique([sourceFilePackage, ...resolveRoots]);

        break;
      }
    }
  } else {
    const findPackage = findClosestPackageRoot(sourceFile, resolveRoots);

    if (findPackage) {
      sourceFilePackage = findPackage;
    }
  }

  // file not find in any package
  if (!sourceFilePackage) {
    return { found: false };
  }

  const resolveAlias = normalizeAlias(alias, sourceFilePackage);

  const searchDirs = unique([sourceFileDir, sourceFilePackage]);

  let configFileOptions = normalizeConfigFileOptions(
    tsconfig,
    searchDirs,
    TSCONFIG_FILENAME,
  );

  if (!configFileOptions) {
    configFileOptions = normalizeConfigFileOptions(
      jsconfig,
      searchDirs,
      JSCONFIG_FILENAME,
    );
  }

  const resolver = new ResolverFactory({
    alias: resolveAlias,
    tsconfig: configFileOptions,
    roots: resolveRoots,
    ...restOptions,
  });

  const result = resolver.sync(sourceFileDir, modulePath);
  if (result.path) {
    return { found: true, path: result.path };
  }

  return { found: false };
}
