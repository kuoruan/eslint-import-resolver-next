// @ts-check

const {
  resolve: resolveModern,
  legacy: resolveLegacy,
} = require("resolve.exports");
const path = require("path");
const fs = require("fs");
const { builtinModules } = require("module");
const { cleanSource, findPackageJson } = require("./utils");

exports.interfaceVersion = 2;

/**
 * @typedef {Object} LegacyOptions - The options for the legacy resolve function
 * @prop {string | boolean} [browser=false]
 *  - the brower option of resolve.exports legacy options
 *  - https://github.com/lukeed/resolve.exports/tree/master?tab=readme-ov-file#optionsbrowser-1
 * @prop {string[]} [fields=['module', 'main']]
 *  - the fields option of resolve.exports legacy options
 *  - https://github.com/lukeed/resolve.exports/tree/master?tab=readme-ov-file#optionsfields
 *
 * @typedef {import("resolve.exports").Options & { legacy?: LegacyOptions | false }} Config
 *
 * @typedef {{found: boolean, path?: string | null}} ResolveResult
 */

/**
 * Resolve the module id.
 *
 * @param {string} source - import source
 * @param {string} file - file
 * @param {Config} config - config
 *
 * @returns {ResolveResult} result
 */
exports.resolve = function (source, file, config) {
  if (source.startsWith(".") || source.startsWith("/")) {
    return { found: false };
  }

  const cleanedSource = cleanSource(source);

  if (builtinModules.includes(cleanedSource)) {
    return { found: true, path: null };
  }

  // get the package name from the source
  const [packageNameOrScope, packageNameOrPath] = cleanedSource.split("/", 3);

  const packageName = packageNameOrScope.startsWith("@")
    ? packageNameOrScope + "/" + packageNameOrPath
    : packageNameOrScope;

  try {
    const filepath = path.dirname(file);

    let pkgFile = findPackageJson(filepath, packageName);

    if (!pkgFile) {
      return { found: false };
    }

    const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));

    const resolved = resolveModern(
      {
        // use packageName to support alias packages
        name: packageName,
        exports: pkg.exports,
        imports: pkg.imports,
      },
      cleanedSource,
      config
    );

    const packagePath = path.dirname(pkgFile);

    if (resolved && resolved.length > 0) {
      if (resolved.length === 1) {
        const moduleId = path.resolve(packagePath, resolved[0]);

        return { found: true, path: moduleId };
      }

      /**
       * if there are multiple resolutions, we will try to resolve them
       * find the first one that exists and return it
       */
      for (const r of resolved) {
        const moduleId = path.resolve(packagePath, r);

        if (fs.existsSync(moduleId)) {
          return { found: true, path: moduleId };
        }
      }
    }

    if (config.legacy !== false) {
      const legacyResolved = resolveLegacy(
        {
          ...pkg,
          name: packageName,
        },
        { ...config.legacy }
      );

      if (legacyResolved) {
        if (typeof legacyResolved === "string") {
          return {
            found: true,
            path: path.resolve(packagePath, legacyResolved),
          };
        } else if (Array.isArray(legacyResolved)) {
          for (const r of legacyResolved) {
            const moduleId = path.resolve(packagePath, r);

            if (fs.existsSync(moduleId)) {
              return { found: true, path: moduleId };
            }
          }
        }
      }
    }
  } catch (/** @type any */ err) {
    return { found: false };
  }

  return { found: false };
};
