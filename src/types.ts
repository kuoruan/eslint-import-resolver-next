import type { NapiResolveOptions } from "oxc-resolver";

export interface PackageGlobOptions {
  ignore?: string[];
  includeRoot?: boolean;
  patterns?: string[];
}

export interface PackageOptions extends PackageGlobOptions {
  pnpmWorkspace?: boolean | string;
}

export interface Options
  extends Omit<NapiResolveOptions, "alias" | "tsconfig"> {
  alias?: Record<string, string | string[]>;
  tsconfig?: boolean | string | NapiResolveOptions["tsconfig"];
  jsconfig?: boolean | string;
  packages?: PackageOptions;
}

export interface Project {
  rootDir: string;
  jsconfig?: string;
  tsconfig?: NapiResolveOptions["tsconfig"];
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
