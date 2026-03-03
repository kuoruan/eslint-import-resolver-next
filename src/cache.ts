import process from "node:process";

import type { FileMatcher } from "get-tsconfig";

/**
 * A generic cache that respects the `NEXT_RESOLVER_CACHE_DISABLED` environment variable.
 * The cache-disabled check is performed inside `get` and `set`, so callers do not need
 * to check `isCacheDisabled` themselves.
 */
export class ResolverCache<K, V> extends Map<K, V> {
  get disabled(): boolean {
    return !!process.env.NEXT_RESOLVER_CACHE_DISABLED;
  }

  get(key: K): V | undefined {
    if (this.disabled) return undefined;
    return super.get(key);
  }

  set(key: K, value: V): this {
    if (this.disabled) return this;

    return super.set(key, value);
  }
}

/**
 * Cache for workspace package paths, keyed by root directory.
 */
export const packagesCache = new ResolverCache<string, string[]>();

/**
 * Persistent cache passed to get-tsconfig's `getTsconfig` function.
 * Keyed by "${configName}:${dirPath}" internally by get-tsconfig.
 * Uses `any` to match the `Cache = Map<string, any>` type from get-tsconfig.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tsconfigSearchCache = new ResolverCache<string, any>();

/**
 * Cache of `FileMatcher` functions keyed by resolved tsconfig file path.
 * Built from `createFilesMatcher` to avoid re-parsing glob patterns for the
 * same tsconfig across multiple source-file resolutions.
 */
export const fileMatcherCache = new ResolverCache<string, FileMatcher>();

/**
 * Cache for parsed YAML files, keyed by file path.
 */
export const yamlCache = new ResolverCache<string, unknown>();
