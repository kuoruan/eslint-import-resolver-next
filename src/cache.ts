import process from "node:process";

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
 */
export const tsconfigSearchCache = new ResolverCache<string, unknown>();

/**
 * Cache for parsed YAML files, keyed by file path.
 */
export const yamlCache = new ResolverCache<string, unknown>();
