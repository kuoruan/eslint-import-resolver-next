import process from "node:process";

import type { FileMatcher } from "get-tsconfig";

/**
 * Whether to disable the cache or not.
 */
const isCacheDisabled = () => !!process.env.NEXT_RESOLVER_CACHE_DISABLED;

/**
 * A generic cache that respects the `NEXT_RESOLVER_CACHE_DISABLED` environment variable.
 * The cache-disabled check is performed inside `get` and `set`, so callers do not need
 * to check `isCacheDisabled` themselves.
 */
export class ResolverCache<K, V> {
  private readonly store = new Map<K, V>();

  get(key: K): V | undefined {
    if (isCacheDisabled()) return undefined;
    return this.store.get(key);
  }

  set(key: K, value: V): void {
    if (isCacheDisabled()) return;
    this.store.set(key, value);
  }

  entries(): [K, V][] {
    return [...this.store.entries()];
  }

  clear(): void {
    this.store.clear();
  }

  /**
   * Returns the underlying `Map` when caching is enabled, or `undefined` when
   * disabled. Use this to pass the cache to external APIs (e.g., `getTsconfig`).
   */
  get map(): Map<K, V> | undefined {
    return isCacheDisabled() ? undefined : this.store;
  }
}

/**
 * Cache for workspace package paths, keyed by root directory.
 */
export const packagesCache = new ResolverCache<string, string[]>();

/**
 * Cache for globbed config file paths, keyed by root directory.
 * @deprecated Used only by the deprecated {@link getConfigFiles} function.
 */
export const configFilesCache = new ResolverCache<string, string[]>();

/**
 * Persistent cache passed to get-tsconfig's `getTsconfig` function.
 * Keyed by "${configName}:${dirPath}" internally by get-tsconfig.
 */
export const tsconfigSearchCache = new ResolverCache<string, any>();

/**
 * Cache of `FileMatcher` instances keyed by tsconfig/jsconfig file path.
 * Used to short-circuit `getTsconfig` directory walks for known configs.
 */
export const fileMatcherCache = new ResolverCache<string, FileMatcher>();

/**
 * Cache for parsed YAML files, keyed by file path.
 */
export const yamlCache = new ResolverCache<string, unknown>();
