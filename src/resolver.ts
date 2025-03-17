import path from "node:path";

import { type NapiResolveOptions } from "oxc-resolver";

import { getRelativeResolver, getResolver } from "./cache.js";
import type { ResolvedResult } from "./types.js";
import { hashObject } from "./utils.js";

/**
 * Resolves relative path imports
 *
 * @param sourceFile - The file that imports the module
 * @param modulePath - The module path to resolve
 * @param options - The resolver options
 * @returns
 */
export function resolveRelativePath(
  sourceFile: string,
  modulePath: string,
  options: NapiResolveOptions,
): ResolvedResult {
  const sourceFileDir = path.dirname(sourceFile);

  const relativeResolver = getRelativeResolver(options);

  const result = relativeResolver.sync(sourceFileDir, modulePath);

  if (result.path) {
    return { found: true, path: result.path };
  }

  return { found: false };
}

/**
 * Resolves a module path
 *
 * @param modulePath - The module path to resolve
 * @param sourceFile - The file that imports the module
 * @param options - The resolver options
 * @returns
 */
export function resolveModulePath(
  sourceFile: string,
  modulePath: string,
  options: NapiResolveOptions,
): ResolvedResult {
  // hash the options to cache the resolver
  // other options are not needed as they are not usually changed
  const hashKey = hashObject({
    alias: options.alias,
    tsconfig: options.tsconfig,
    roots: options.roots,
  });

  const resolver = getResolver(hashKey, options);

  const result = resolver.sync(path.dirname(sourceFile), modulePath);

  if (result.path) {
    return { found: true, path: result.path };
  }

  return { found: false };
}
