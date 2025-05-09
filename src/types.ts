import type { NapiResolveOptions } from "unrs-resolver";

export interface PackageGlobOptions {
  /**
   * Patterns to search for package.json files.
   */
  patterns?: string[];

  /**
   * Ignore patterns when searching for package.json files.
   *
   * @default ["**\/node_modules/**", "**\/bower_components/**", "**\/test/**", "**\/tests/**"]
   */
  ignore?: string[];
  /**
   * Include the root directory when searching for package.json files.
   *
   * @default false
   */
  includeRoot?: boolean;
}

export interface PackageOptions extends PackageGlobOptions {
  /**
   * Use pnpm-workspace.yaml to find the packages.
   */
  pnpmWorkspace?: boolean | string;
}

export type ConfigFileOptions = Partial<NapiResolveOptions["tsconfig"]> & {
  ignore?: string[];
};

export interface Options
  extends Omit<NapiResolveOptions, "alias" | "tsconfig"> {
  /**
   * Alias to resolve the paths.
   */
  alias?: Record<string, string | string[]>;
  /**
   * The tsconfig.json options.
   *
   * - `true` to auto find `tsconfig.json`
   * - `false` to disable auto find `tsconfig.json`
   * - `string` to specify the filename or the absolute path of `tsconfig.json` file
   * - `object` to specify the `tsconfig.json` options
   */
  tsconfig?: boolean | string | ConfigFileOptions;
  /**
   * The jsconfig.json options.
   *
   * - `true` to auto find `jsconfig.json`
   * - `false` to disable auto find `jsconfig.json`
   * - `string` to specify the filename or the absolute path of `jsconfig.json` file
   * - `object` to specify the `jsconfig.json` options
   */
  jsconfig?: boolean | string | ConfigFileOptions;
  /**
   * Mono-repo package patterns.
   *
   * - `string[]` to specify the package patterns
   * - `object` to specify the package options, see `PackageOptions`
   */
  packages?: string[] | PackageOptions;

  bun?: boolean;
}

export interface ResultNotFound {
  found: false;
  path?: undefined;
}

export interface ResultFound {
  found: true;
  path: string | null;
}

export type ResolvedResult = ResultNotFound | ResultFound;

export interface NextImportResolver {
  interfaceVersion: 3;
  /** optional name for the resolver, this is used in logs/debug output */
  name?: string;
  resolve: (modulePath: string, sourceFile: string) => ResolvedResult;
}
