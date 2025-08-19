import { isBunBuiltin } from "is-bun-module";

import { defaultOptions } from "./constants.js";
import { resolveModulePath, resolveRelativePath } from "./resolver.js";
import type { NextImportResolver, Options, ResolvedResult } from "./types.js";
import {
  findClosestPackageRoot,
  findWorkspacePackages,
  getResolveRoots,
  hasBunPrefix,
  hasNodePrefix,
  isNodeBuiltin,
  normalizeAlias,
  normalizeConfigFileOptions,
  removeQueryString,
  unique,
} from "./utils.js";

export function checkBuiltinModule(
  modulePath: string,
  isBun = false,
): ResolvedResult | undefined {
  if (isBun) {
    if (isBunBuiltin(modulePath)) {
      return { found: true, path: null };
    }

    if (hasNodePrefix(modulePath) || hasBunPrefix(modulePath)) {
      return { found: false };
    }
  } else {
    if (hasNodePrefix(modulePath)) {
      const result = isNodeBuiltin(modulePath);

      return result ? { found: true, path: null } : { found: false };
    }

    if (hasBunPrefix(modulePath)) {
      return { found: false };
    }

    if (isNodeBuiltin(modulePath)) {
      return { found: true, path: null };
    }
  }
}

export function resolve(
  modulePath: string,
  sourceFile: string,
  config?: Options | null,
): ResolvedResult {
  const cleanedPath = removeQueryString(modulePath);

  const { roots, alias, packages, jsconfig, tsconfig, bun, ...restOptions } = {
    ...defaultOptions,
    ...config,
  };

  const result = checkBuiltinModule(cleanedPath, bun);
  if (result) {
    return result;
  }

  if (hasNodePrefix(cleanedPath) || hasBunPrefix(cleanedPath)) {
    const result = isNodeBuiltin(cleanedPath);

    return result ? { found: true, path: null } : { found: false };
  }

  // relative path
  if (modulePath.startsWith(".")) {
    return resolveRelativePath(sourceFile, modulePath, restOptions);
  }

  const resolveRoots = getResolveRoots(roots);

  const workspacePackages = findWorkspacePackages(resolveRoots, packages);

  const packageDir = findClosestPackageRoot(sourceFile, workspacePackages);

  // file not find in any package
  if (!packageDir) {
    return { found: false };
  }

  const packageRoots = unique([packageDir, ...resolveRoots]);

  const resolveAlias = normalizeAlias(alias, packageDir);

  const configFileOptions = normalizeConfigFileOptions(
    { tsconfig, jsconfig },
    packageDir,
    sourceFile,
  );

  return resolveModulePath(sourceFile, modulePath, {
    alias: resolveAlias,
    tsconfig: configFileOptions,
    roots: packageRoots,
    ...restOptions,
  });
}

export function createNextImportResolver(
  config?: Options | null,
): NextImportResolver {
  const { roots, alias, packages, jsconfig, tsconfig, bun, ...restOptions } = {
    ...defaultOptions,
    ...config,
  };

  const resolveRoots = getResolveRoots(roots);

  const workspacePackages = findWorkspacePackages(resolveRoots, packages);

  return {
    interfaceVersion: 3,
    name: "eslint-import-resolver-next",
    resolve: (modulePath: string, sourceFile: string) => {
      const cleanedPath = removeQueryString(modulePath);

      const result = checkBuiltinModule(cleanedPath, bun);
      if (result) {
        return result;
      }

      const packageDir = findClosestPackageRoot(sourceFile, workspacePackages);

      // file not find in any package
      if (!packageDir) {
        return { found: false };
      }

      const packageRoots = unique([packageDir, ...resolveRoots]);

      const resolveAlias = normalizeAlias(alias, packageDir);

      const configFileOptions = normalizeConfigFileOptions(
        { tsconfig, jsconfig },
        packageDir,
        sourceFile,
      );

      return resolveModulePath(sourceFile, modulePath, {
        alias: resolveAlias,
        tsconfig: configFileOptions,
        roots: packageRoots,
        ...restOptions,
      });
    },
  };
}
