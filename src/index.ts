import { createNextImportResolver, resolve } from "./resolve.js";
import type {
  ConfigFileOptions,
  NextImportResolver,
  Options,
  PackageGlobOptions,
  PackageOptions,
} from "./types.js";

const interfaceVersion = 2;

export type {
  ConfigFileOptions,
  NextImportResolver,
  Options,
  PackageGlobOptions,
  PackageOptions,
};

export { createNextImportResolver, interfaceVersion, resolve };

export default {
  interfaceVersion,
  resolve,
};
