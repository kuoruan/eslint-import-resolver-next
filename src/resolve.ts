import { builtinModules } from "module";
import { ResolverFactory } from "oxc-resolver";
import path from "path";
import { cwd } from "process";

import { defaultOptions } from "./constants";
import type { Options, ResolvedResult } from "./types";
import {
  cleanModulePath,
  findClosestPackageRoot,
  findPackages,
  getJsconfigAlias,
  normalizeAlias,
  normalizePackageGlobOptions,
  normalizeTsconfigOptions,
} from "./utils";

const processCwd = cwd();

const pathToPackagesMap = new Map<string, string[]>();

export default function resolve(
  modulePath: string,
  sourceFile: string,
  config?: Options | null,
): ResolvedResult {
  if (modulePath.startsWith(".") || modulePath.startsWith("/")) {
    return { found: false };
  }

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

  let resolveRoots = !roots || roots.length === 0 ? [processCwd] : roots;
  let resolveAlias = normalizeAlias(alias);

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

        resolveRoots = Array.from(
          new Set([sourceFilePackage, ...resolveRoots]),
        );

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

  const tsconfigOptions = normalizeTsconfigOptions(
    sourceFilePackage,
    sourceFile,
    tsconfig,
  );

  if (!tsconfigOptions) {
    const jsconfigPaths = getJsconfigAlias(
      sourceFilePackage,
      sourceFile,
      jsconfig,
    );

    if (jsconfigPaths) {
      resolveAlias = { ...jsconfigPaths, ...resolveAlias };
    }
  }

  const resolver = new ResolverFactory({
    alias: resolveAlias,
    tsconfig: tsconfigOptions,
    roots: resolveRoots,
    ...restOptions,
  });

  const result = resolver.sync(path.dirname(sourceFile), modulePath);

  if (!result.path) {
    return { found: false };
  }

  return { found: true, path: result.path };
}
