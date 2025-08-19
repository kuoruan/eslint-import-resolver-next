import path from "node:path";

import { type NapiResolveOptions, ResolverFactory } from "oxc-resolver";

import type { ResolvedResult } from "./types.js";
import { hashObject } from "./utils.js";

let relativeResolver: ResolverFactory | null = null;

export function getRelativeResolver(
  options: NapiResolveOptions,
): ResolverFactory {
  relativeResolver ??= new ResolverFactory(options);

  return relativeResolver;
}

export function resetRelativeResolver(): void {
  if (relativeResolver) {
    relativeResolver.clearCache();
  }

  relativeResolver = null;
}

const MAX_RESOLVER_CACHE_SIZE = 4;

const resolverMap = new Map<string, ResolverFactory>();

export function getResolver(
  hashKey: string,
  options: NapiResolveOptions,
): ResolverFactory {
  if (resolverMap.has(hashKey)) {
    return resolverMap.get(hashKey)!;
  }

  if (resolverMap.size >= MAX_RESOLVER_CACHE_SIZE) {
    const firstKey = resolverMap.keys().next().value!;

    const oldResolver = resolverMap.get(firstKey)!;
    oldResolver.clearCache();

    resolverMap.delete(firstKey);
  }

  const resolver = new ResolverFactory(options);

  resolverMap.set(hashKey, resolver);

  return resolver;
}

export function resetResolvers(): void {
  for (const resolver of resolverMap.values()) {
    resolver.clearCache();
  }

  resolverMap.clear();
}

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
