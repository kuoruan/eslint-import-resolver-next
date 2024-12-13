import { createNextImportResolver, resolve } from "./resolve";
import type {
  NewResolver,
  Options,
  PackageGlobOptions,
  PackageOptions,
} from "./types";

const interfaceVersion = 2;

export type { NewResolver, Options, PackageGlobOptions, PackageOptions };

export { createNextImportResolver, interfaceVersion, resolve };

export default {
  interfaceVersion,
  resolve,
};
