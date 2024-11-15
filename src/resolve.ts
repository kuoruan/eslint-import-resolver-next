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
  getJsconfigPaths,
  normalizeAlias,
  normalizePackageGlobOptions,
  normalizeTsconfigOptions,
} from "./utils";

const processCwd = cwd();

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

  const resolveRoots = !roots || roots.length === 0 ? [processCwd] : roots;
  let resolveAlias = normalizeAlias(alias);

  let packageRoot: string = processCwd;

  if (typeof packages === "object") {
    for (const r of resolveRoots) {
      const globOptions = normalizePackageGlobOptions(packages, r);

      const paths = findPackages(r, globOptions);
      if (paths.length === 0) {
        continue;
      }

      const filePackage = findClosestPackageRoot(sourceFile, paths);
      if (filePackage) {
        packageRoot = filePackage;
        break;
      }
    }
  }

  const tsconfigOptions = normalizeTsconfigOptions(
    packageRoot,
    sourceFile,
    tsconfig,
  );

  if (!tsconfigOptions) {
    const jsconfigPaths = getJsconfigPaths(packageRoot, sourceFile, jsconfig);

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
