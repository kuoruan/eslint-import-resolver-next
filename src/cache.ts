/**
 * Whether to disable the cache or not.
 */
const isCacheDisabled = () => !!process.env.NEXT_RESOLVER_CACHE_DISABLED;

const pathToPackagesCache = new Map<string, string[]>();

export function getPackagesCache(root: string): string[] | null {
  if (isCacheDisabled()) return null;

  if (pathToPackagesCache.has(root)) {
    return pathToPackagesCache.get(root)!;
  }

  return null;
}

export function setPackagesCache(root: string, packagePaths: string[]): void {
  if (isCacheDisabled()) return;

  pathToPackagesCache.set(root, packagePaths);
}

export function clearPackagesCache(): void {
  if (isCacheDisabled()) return;

  pathToPackagesCache.clear();
}

const configFilesCache = new Map<string, string[]>();

export function getConfigFilesCache(root: string): string[] | null {
  if (isCacheDisabled()) return null;

  if (configFilesCache.has(root)) {
    return configFilesCache.get(root)!;
  }

  return null;
}

export function setConfigFilesCache(root: string, configFiles: string[]): void {
  if (isCacheDisabled()) return;

  configFilesCache.set(root, configFiles);
}

export function clearConfigFilesCache(): void {
  if (isCacheDisabled()) return;

  configFilesCache.clear();
}

const yamlCache = new Map<string, unknown>();

export function getYamlCache(root: string): unknown {
  if (isCacheDisabled()) return null;

  if (yamlCache.has(root)) {
    return yamlCache.get(root)!;
  }

  return null;
}

export function setYamlCache(root: string, yaml: unknown): void {
  if (isCacheDisabled()) return;

  yamlCache.set(root, yaml);
}

export function clearYamlCache(): void {
  if (isCacheDisabled()) return;

  yamlCache.clear();
}
