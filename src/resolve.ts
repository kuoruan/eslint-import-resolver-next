import { builtinModules } from "module";
import { cwd } from "process";

import { defaultOptions } from "./constants";
import { resolveModulePath, resolveRelativePath } from "./resolver";
import type { NewResolver, Options, ResolvedResult } from "./types";
import {
  cleanModulePath,
  findClosestPackageRoot,
  findWorkspacePackages,
  normalizeAlias,
  normalizeConfigFileOptions,
  unique,
} from "./utils";

export function resolve(
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

  const resolveRoots = roots?.length ? roots : [cwd()];

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

export function createNextImportResolver(config?: Options | null): NewResolver {
  const { roots, alias, packages, jsconfig, tsconfig, ...restOptions } = {
    ...defaultOptions,
    ...config,
  };

  const resolveRoots = roots?.length ? roots : [cwd()];

  const workspacePackages = findWorkspacePackages(resolveRoots, packages);

  return {
    interfaceVersion: 3,
    name: "eslint-import-resolver-next",
    resolve: (modulePath: string, sourceFile: string) => {
      const cleanedPath = cleanModulePath(modulePath);

      if (builtinModules.includes(cleanedPath)) {
        return { found: true, path: null };
      }

      // wrong node module path
      if (modulePath.startsWith("node:")) {
        return { found: false };
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
