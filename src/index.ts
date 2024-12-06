import resolve from "./resolve";
import type {
  NewResolver,
  Options,
  PackageGlobOptions,
  PackageOptions,
} from "./types";

const interfaceVersion = 2;

export function createNextImportResolver(options: Options): NewResolver {
  return {
    interfaceVersion: 3,
    name: "eslint-import-resolver-next",
    resolve: (modulePath: string, sourceFile: string) =>
      resolve(modulePath, sourceFile, options),
  };
}

export type { NewResolver, Options, PackageGlobOptions, PackageOptions };

export { interfaceVersion, resolve };
