import { type NapiResolveOptions, ResolverFactory } from "oxc-resolver";

const pathToPackagesCache = new Map<string, string[]>();

export function getPackagesCache(root: string): string[] | null {
  if (pathToPackagesCache.has(root)) {
    return pathToPackagesCache.get(root)!;
  }

  return null;
}

export function setPackagesCache(root: string, packagePaths: string[]): void {
  pathToPackagesCache.set(root, packagePaths);
}

const configFilesCache = new Map<string, string[]>();

export function getConfigFilesCache(root: string): string[] | null {
  if (configFilesCache.has(root)) {
    return configFilesCache.get(root)!;
  }

  return null;
}

export function setConfigFilesCache(root: string, configFiles: string[]): void {
  configFilesCache.set(root, configFiles);
}

const yamlCache = new Map<string, unknown>();

export function getYamlCache(root: string): unknown {
  if (yamlCache.has(root)) {
    return yamlCache.get(root)!;
  }

  return null;
}

export function setYamlCache(root: string, yaml: unknown): void {
  yamlCache.set(root, yaml);
}

let relativeResolver: ResolverFactory | null = null;

export function getRelativeResolver(
  options: NapiResolveOptions,
): ResolverFactory {
  if (!relativeResolver) {
    relativeResolver = new ResolverFactory(options);
  }

  return relativeResolver;
}

const MAX_RESOLVER_CACHE_SIZE = 4;

const resolverCache = new Map<string, ResolverFactory>();

export function getResolver(
  hashKey: string,
  options: NapiResolveOptions,
): ResolverFactory {
  if (resolverCache.has(hashKey)) {
    return resolverCache.get(hashKey)!;
  }

  if (resolverCache.size >= MAX_RESOLVER_CACHE_SIZE) {
    const firstKey = resolverCache.keys().next().value!;

    const oldResolver = resolverCache.get(firstKey)!;
    oldResolver.clearCache();

    resolverCache.delete(firstKey);
  }

  const resolver = new ResolverFactory(options);

  resolverCache.set(hashKey, resolver);

  return resolver;
}
