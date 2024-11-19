// @ts-check

const path = require("path");
const fs = require("fs");

/**
 * Remove prefix and querystrings from the source.
 * When using node: prefix, we should remove it.
 * Some imports may have querystrings, for example:
 *  * import "foo?bar";
 *
 * @param {string} source the import source
 *
 * @retures {string} cleaned source
 */
function cleanSource(source) {
  if (source.indexOf("node:") === 0) {
    return source.slice(5);
  }

  const querystringIndex = source.lastIndexOf("?");

  if (querystringIndex > -1) {
    return source.slice(0, querystringIndex);
  }

  return source;
}

/**
 * Finds package.json for a package
 *
 * @param {string} filepath file path
 * @param {string} packageName package name
 *
 * @returns {string | null} package.json file path
 */
function findPackageJson(filepath, packageName) {
  for (;;) {
    const pkgFile = path.join(
      filepath,
      "node_modules",
      packageName,
      "package.json"
    );
    if (fs.existsSync(pkgFile)) {
      return pkgFile;
    }
    const dir = path.dirname(filepath);
    if (dir === filepath) {
      return null;
    }
    filepath = dir;
  }
}

exports.cleanSource = cleanSource;
exports.findPackageJson = findPackageJson;
