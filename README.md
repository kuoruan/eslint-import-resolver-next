# eslint-import-resolver-next

[![npm](https://img.shields.io/npm/v/eslint-import-resolver-next.svg)](https://www.npmjs.com/package/eslint-import-resolver-next)
[![npm](https://img.shields.io/npm/dw/eslint-import-resolver-next.svg)](https://www.npmjs.com/package/eslint-import-resolver-next)
[![npm](https://img.shields.io/npm/l/eslint-import-resolver-next.svg)](https://www.npmjs.com/package/eslint-import-resolver-next)

The next resolver plugin for [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import) or [`eslint-plugin-import-x`](https://www.npmjs.com/package/eslint-plugin-import-x) that resolves modules with [`unrs-resolver`](https://github.com/unrs/unrs-resolver).

## Features

- Resolves modules using the [`unrs-resolver`](https://github.com/unrs/unrs-resolver) package.
- Support mono-repos and `pnpm-workspaces.yaml`.
- Support paths alias defined in `tsconfig.compilerOptions.paths` or `jsconfig.compilerOptions.paths`.

## Usage

1. Install the package:

```sh
npm install -D eslint-import-resolver-next
```

2. Add it as a resolver to your ESLint configuration.

Example config:

```js
module.exports = {
  // ... other configuration options
  settings: {
    "import/resolver": {
      next: {
        // Options for the resolver
      },
    },
  },
};
```

with Mono-repo:

```js
module.exports = {
  // ... other configuration options
  settings: {
    "import/resolver": {
      next: {
        packages: ["packages/*"],
      },
    },
  },
};
```

pnpm-workspaces:

```js
module.exports = {
  // ... other configuration options
  settings: {
    "import/resolver": {
      next: {
        packages: {
          pnpmWorkspace: true,
          includeRoot: true,
        },
      },
    },
  },
};
```

3. For [eslint-plugin-import-x](https://github.com/un-ts/eslint-plugin-import-x/) `resolver-next`

```js
const { createNextImportResolver } = require("eslint-import-resolver-next");

module.exports = {
  // ... other configuration options
  settings: {
    "import-x/resolver-next": [createNextImportResolver({
      // Options for the resolver
    })],
  },
};
```

## Options

- `roots` (Array<string>): The directories to search for modules. Default: `[process.cwd()]`.

- `alias` (Record<string, string | string[]>): The paths alias. Default: `undefined`.
  * The alias can be set as relative paths. relative paths are resolved from the package directory.

- `tsconfig` (boolean | string | object): Weather to use the `tsconfig.json` file. Default: `true`.
  * If `true`, the resolver will try to find the `tsconfig.json` file close to the source file.
  * If a string, it's the name of the file to search for or the absolute path to the file.
  * If an object, see `ConfigFileOptions`.

- `jsconfig` (boolean | string | object): Weather to use the `jsconfig.json` file. Default: `true`.
  * If `true`, the resolver will try to find the `jsconfig.json` file close to the source file.
  * If a string, it's the name of the file to search for or the absolute path to the file.
  * If an object, see `ConfigFileOptions`.

- `packages` (string[] | PackageOptions): The patterns or options to search for packages. Default: `undefined`.
  * If an array, the resolver will search for packages in the specified patterns.
  * If an object, see `PackageOptions`.

- `bun` (boolean): Weather to enable the `bun` support. Default: `true` if bun environment is detected.
  * If `true`, the resolver will try to resolve bun built-in modules.

All other options are passed to the `unrs-resolver` package. See the [unrs-resolver documentation](https://github.com/unrs/unrs-resolver#options)

### ConfigFileOptions

The `tsconfig` and `jsconfig` options can have the following properties:

- `configFile` (string): The name of the file to search for or the absolute path to the file. Default: `tsconfig.json`.
- `ignore` (string[]): The directories to ignore. Default: `["**/node_modules/**"]`.
- `references` ('auto' | string[]): Support for Typescript Project References. Default: `'auto'`.
  * If `'auto'`, the resolver will try to find the `references` field in the `tsconfig.json` file.
  * If an array, the resolver will use the specified references.

### PackageOptions

A folder with a `package.json` file is considered a package. The `PackageOptions` object can have the following properties:

- `patterns` (string[]): The patterns to search for packages. Default: `["."]`.
- `ignore` (string[]): The directories to ignore. Default: `["**/node_modules/**", "**/bower_components/**", "**/test/**", "**/tests/**"]`.
- `includeRoot` (boolean): Weather to include the root directory. Default: `false`.
- `pnpmWorkspace` (boolean | string): Weather to use the `pnpm-workspace.yaml` file to find packages. Default: `false`.
  * If `true`, the resolver will try to find the `pnpm-workspace.yaml` file in the package directory.
  * If a string, define the path to the `pnpm-workspace.yaml` file.
