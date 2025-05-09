import mock from "mock-fs";
import process from "process";

import { defaultConfigFileOptions } from "@/constants";
import {
  findAllPackages,
  findClosestConfigFile,
  findClosestPackageRoot,
  findWorkspacePackages,
  getConfigFiles,
  getPathDepth,
  normalizeAlias,
  normalizeConfigFileOptions,
  normalizePackageGlobOptions,
  normalizePatterns,
  readYamlFile,
  sortConfigFiles,
  sortPathsByDepth,
} from "@/utils";

process.env.NEXT_RESOLVER_CACHE_DISABLED = "1";

describe.runIf(process.platform !== "win32")("utils non-Windows", () => {
  describe("test normalize patterns", () => {
    it("normalize patterns", () => {
      const result1 = normalizePatterns(["/path/to/pattern"]);
      const result2 = normalizePatterns(["/", "/path/to/"]);
      const result3 = normalizePatterns(["\\path\\to\\pattern"]);
      const result4 = normalizePatterns(["/path/*", "/to/**"]);
      const result5 = normalizePatterns(["/path/*/", "/to/**/"]);

      expect(result1).toEqual([
        "/path/to/pattern/package.json",
        "/path/to/pattern/package.json5",
        "/path/to/pattern/package.yaml",
      ]);
      expect(result2).toEqual([
        "/package.json",
        "/package.json5",
        "/package.yaml",
        "/path/to/package.json",
        "/path/to/package.json5",
        "/path/to/package.yaml",
      ]);
      expect(result3).toEqual([
        "/path/to/pattern/package.json",
        "/path/to/pattern/package.json5",
        "/path/to/pattern/package.yaml",
      ]);
      expect(result4).toEqual([
        "/path/*/package.json",
        "/path/*/package.json5",
        "/path/*/package.yaml",
        "/to/**/package.json",
        "/to/**/package.json5",
        "/to/**/package.yaml",
      ]);
      expect(result5).toEqual([
        "/path/*/package.json",
        "/path/*/package.json5",
        "/path/*/package.yaml",
        "/to/**/package.json",
        "/to/**/package.json5",
        "/to/**/package.yaml",
      ]);
    });
  });

  describe("test getPathDepth", () => {
    it("returns 0 for empty path", () => {
      expect(getPathDepth("")).toBe(0);
    });

    it("returns correct depth for absolute paths", () => {
      expect(getPathDepth("/")).toBe(0);
      expect(getPathDepth("/foo")).toBe(1);
      expect(getPathDepth("/foo/bar")).toBe(2);
      expect(getPathDepth("/foo/bar/baz")).toBe(3);
    });

    it("returns correct depth for relative paths", () => {
      expect(getPathDepth("foo")).toBe(1);
      expect(getPathDepth("foo/bar")).toBe(2);
      expect(getPathDepth("foo/bar/baz")).toBe(3);
    });

    it("handles consecutive separators", () => {
      expect(getPathDepth("//foo//bar")).toBe(2);
      expect(getPathDepth("foo//bar//baz")).toBe(3);
    });
  });

  describe("test sort paths", () => {
    it("sort paths by depth", () => {
      const paths = ["/a/b/c", "/a/b", "/a", "/"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["/a/b/c", "/a/b", "/a", "/"]);
    });

    it("sort paths with same depth reversed alphabetically", () => {
      const paths = ["/a/b", "/a/a", "/a/c"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["/a/c", "/a/b", "/a/a"]);
    });

    it("sort paths with mixed depths and root", () => {
      const paths = ["/a/b/c", "/a/b", "/", "/a"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["/a/b/c", "/a/b", "/a", "/"]);
    });

    it("sort paths with mixed depths and root and reversed alphabetically", () => {
      const paths = ["/a/b/c", "/a/b", "/", "/a/a", "/a/c"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["/a/b/c", "/a/c", "/a/b", "/a/a", "/"]);
    });
  });

  describe("test readYamlFile", () => {
    beforeEach(() => {
      mock.restore();
    });

    it("read yaml file", () => {
      mock({
        "/path/to/file.yaml": "key: value",
      });

      const data = readYamlFile("/path/to/file.yaml");
      expect(data).toEqual({ key: "value" });
    });

    it("returns null for non-existent file", () => {
      const data = readYamlFile("/non/existent/file.yaml");
      expect(data).toBeNull();
    });

    it("returns cached value if available", () => {
      process.env.NEXT_RESOLVER_CACHE_DISABLED = "";

      mock({
        "/path/to/file1.yaml": "key: cached-value",
      });

      // First read to populate cache
      const firstRead = readYamlFile("/path/to/file1.yaml");
      expect(firstRead).toEqual({ key: "cached-value" });

      // Change file content
      mock({
        "/path/to/file1.yaml": "key: new-value",
      });

      // Second read should return cached value
      const secondRead = readYamlFile("/path/to/file1.yaml");
      expect(secondRead).toEqual({ key: "cached-value" });

      process.env.NEXT_RESOLVER_CACHE_DISABLED = "1";
    });

    it("read complex yaml file", () => {
      mock({
        "/path/to/file2.yaml": `
        key1: value1
        key2:
          - item1
          - item2
        key3:
          subkey1: subvalue1
          subkey2: subvalue2
      `,
      });

      const data = readYamlFile("/path/to/file2.yaml");
      expect(data).toEqual({
        key1: "value1",
        key2: ["item1", "item2"],
        key3: {
          subkey1: "subvalue1",
          subkey2: "subvalue2",
        },
      });
    });

    it("read pnpm workspace yaml file", () => {
      mock({
        "/path/to/file3.yaml": `
          packages:
            - package1
            - package2
        `,
      });

      const data = readYamlFile("/path/to/file3.yaml");
      expect(data).toEqual({
        packages: ["package1", "package2"],
      });
    });

    it("read yaml file with empty content", () => {
      mock({
        "/path/to/file4.yaml": "",
      });

      const data = readYamlFile("/path/to/file4.yaml");
      expect(data).toEqual(null);
    });

    it("read invalid yaml file", () => {
      mock({
        "/path/to/file5.yaml": "key: value\nkey2",
      });

      expect(readYamlFile("/path/to/file5.yaml")).toEqual(null);
    });
  });

  describe("test findClosestPackageRoot", () => {
    it("find closest package root", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const paths = ["/a/b/c", "/a/b", "/a"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("/a/b/c");
    });

    it("find closest package root with root path", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const paths = ["/a/b/c", "/a/b", "/"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("/a/b/c");
    });

    it("find closest package root with no match", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const paths = ["/x/y", "/z"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBeUndefined();
    });

    it("find closest package root with multiple matches", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const paths = ["/a/b/c/d", "/a/b/c", "/a/b", "/a"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("/a/b/c/d");
    });
  });

  describe("test findClosestConfigFile", () => {
    it("find closest config file", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = [
        "/a/b/c/config.json",
        "/a/b/config.json",
        "/a/config.json",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/c/config.json");
    });

    it("find closest config file with root path", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = ["/a/b/config.json", "/config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/config.json");
    });

    it("find closest config file with no match", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = ["/x/y/config.json", "/z/config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBeUndefined();
    });

    it("find closest config file with multiple matches", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = [
        "/a/b/c/d/config.json",
        "/a/b/c/config.json",
        "/a/b/config.json",
        "/a/config.json",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/c/d/config.json");
    });

    it("find closest config file with different extensions", () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = [
        "/a/b/config.json",
        "/a/config.yaml",
        "/config.json5",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/config.json");
    });

    it('find closest config file with "tsconfig" filename', () => {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = ["/a/b/c/tsconfig.json", "/a/b/c/jsconfig.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/c/tsconfig.json");
    });
  });

  describe("test normalize alias", () => {
    it("normalize alias with absolute paths", () => {
      const alias = {
        "@components": "/src/components",
        "@utils": "/src/utils",
      };

      const normalizedAlias = normalizeAlias(alias, "/");
      expect(normalizedAlias).toEqual({
        "@components": ["/src/components"],
        "@utils": ["/src/utils"],
      });
    });

    it("normalize alias with relative paths", () => {
      const alias = {
        "@components": "src/components",
        "@utils": "src/utils",
      };
      const normalizedAlias = normalizeAlias(alias, "/home/project");
      expect(normalizedAlias).toEqual({
        "@components": ["/home/project/src/components"],
        "@utils": ["/home/project/src/utils"],
      });
    });

    it("normalize alias with mixed paths", () => {
      const alias = {
        "@components": ["/src/components", "src/extra-components"],
        "@utils": "src/utils",
      };

      const normalizedAlias = normalizeAlias(alias, "/home/project");
      expect(normalizedAlias).toEqual({
        "@components": [
          "/src/components",
          "/home/project/src/extra-components",
        ],
        "@utils": ["/home/project/src/utils"],
      });
    });

    it("normalize alias with no alias", () => {
      const normalizedAlias = normalizeAlias(undefined, "/");
      expect(normalizedAlias).toBeUndefined();
    });
  });

  describe("test normalizePackageGlobOptions", () => {
    beforeEach(() => {
      mock.restore();
    });

    it("normalizes string array patterns", () => {
      const opts = ["packages/*", "apps/*"];
      const result = normalizePackageGlobOptions(opts, "/root");
      expect(result).toEqual({
        patterns: ["packages/*", "apps/*"],
      });
    });

    it("normalizes PackageOptions with patterns", () => {
      const opts = {
        patterns: ["packages/*", "apps/*"],
        ignore: ["**/node_modules/**"],
      };
      const result = normalizePackageGlobOptions(opts, "/root");
      expect(result).toEqual({
        patterns: ["packages/*", "apps/*"],
        ignore: ["**/node_modules/**"],
      });
    });

    it("reads pnpm workspace file when pnpmWorkspace is true", () => {
      mock({
        "/root/pnpm-workspace.yaml": `
          packages:
            - packages/*
            - apps/*
        `,
      });

      const opts = { pnpmWorkspace: true };
      const result = normalizePackageGlobOptions(opts, "/root");
      expect(result).toEqual({
        patterns: ["packages/*", "apps/*"],
      });
    });

    it("reads custom pnpm workspace file path", () => {
      mock({
        "/root/custom-workspace.yaml": `
        packages:
          - custom-packages/*
          - custom-apps/*
      `,
      });

      const opts = { pnpmWorkspace: "custom-workspace.yaml" };
      const result = normalizePackageGlobOptions(opts, "/root");
      expect(result).toEqual({
        patterns: ["custom-packages/*", "custom-apps/*"],
      });
    });

    it("merges patterns from pnpm workspace and explicit patterns", () => {
      mock({
        "/root/pnpm-workspace.yaml": `
          packages:
            - packages/*
            - apps/*
        `,
      });

      const opts = {
        pnpmWorkspace: true,
        patterns: ["extra/*"],
        ignore: ["**/dist/**"],
      };
      const result = normalizePackageGlobOptions(opts, "/root");
      expect(result).toEqual({
        patterns: ["packages/*", "apps/*", "extra/*"],
        ignore: ["**/dist/**"],
      });
    });

    it("returns rest options when no patterns found", () => {
      const opts = {
        ignore: ["**/node_modules/**"],
        expandDirectories: false,
      };
      const result = normalizePackageGlobOptions(opts, "/root");
      expect(result).toEqual({
        ignore: ["**/node_modules/**"],
        expandDirectories: false,
      });
    });

    it("handles empty or invalid pnpm workspace file", () => {
      mock({
        "/root/pnpm-workspace.yaml": "",
      });

      const opts = { pnpmWorkspace: true };

      const result = normalizePackageGlobOptions(opts, "/root");
      expect(result).toEqual({});
    });

    it("removes duplicate patterns", () => {
      mock({
        "/root/pnpm-workspace.yaml": `
          packages:
            - packages/*
            - apps/*
        `,
      });

      const opts = {
        pnpmWorkspace: true,
        patterns: ["packages/*", "extra/*"],
      };
      const result = normalizePackageGlobOptions(opts, "/root");
      expect(result).toEqual({
        patterns: ["packages/*", "apps/*", "extra/*"],
      });
    });

    it("empty patterns when no patterns found", () => {
      const result = normalizePackageGlobOptions([], "/root");

      expect(result).toEqual({ patterns: [] });
    });
  });

  describe("test findAllPackages", () => {
    beforeEach(() => {
      mock.restore();
    });

    it("finds packages with string array patterns", () => {
      mock({
        "/root/packages/a/package.json": "{}",
        "/root/packages/b/package.json": "{}",
        "/root/apps/c/package.json": "{}",
      });

      const packages = findAllPackages("/root", ["packages/*", "apps/*"]);
      expect(packages).toEqual([
        "/root/apps/c",
        "/root/packages/a",
        "/root/packages/b",
      ]);
    });

    it("finds packages with PackageOptions", () => {
      mock({
        "/root/packages/a/package.json": "{}",
        "/root/packages/b/package.json": "{}",
        "/root/node_modules/c/package.json": "{}",
      });

      const packages = findAllPackages("/root", {
        patterns: ["packages/*"],
        ignore: ["**/node_modules/**"],
      });
      expect(packages).toEqual(["/root/packages/a", "/root/packages/b"]);
    });

    it("includes root package when includeRoot is true", () => {
      mock({
        "/root/package.json": "{}",
        "/root/packages/a/package.json": "{}",
      });

      const packages = findAllPackages("/root", {
        patterns: ["packages/*"],
        includeRoot: true,
      });
      expect(packages).toEqual(["/root", "/root/packages/a"]);
    });

    it("returns empty array when no packages found", () => {
      mock({
        "/root/src/index.ts": "",
      });

      const packages = findAllPackages("/root", ["packages/*"]);
      expect(packages).toEqual([]);
    });

    it("handles multiple package descriptor formats", () => {
      mock({
        "/root/a/package.json": "{}",
        "/root/b/package.yaml": "name: b",
        "/root/c/package.json5": "{}",
      });

      const packages = findAllPackages("/root", ["*"]);
      expect(packages).toEqual(["/root/a", "/root/b", "/root/c"]);
    });

    it("returns cached results on subsequent calls", () => {
      process.env.NEXT_RESOLVER_CACHE_DISABLED = "";

      mock({
        "/root/packages/a/package.json": "{}",
        "/root/packages/b/package.json": "{}",
      });

      const firstCall = findAllPackages("/root", ["packages/*"]);
      expect(firstCall).toEqual(["/root/packages/a", "/root/packages/b"]);

      // Add new package after first call
      mock({
        "/root/packages/c/package.json": "{}",
      });

      const secondCall = findAllPackages("/root", ["packages/*"]);
      // Should return cached result, ignoring new package
      expect(secondCall).toEqual(["/root/packages/a", "/root/packages/b"]);

      process.env.NEXT_RESOLVER_CACHE_DISABLED = "1";
    });

    it("removes duplicate package paths", () => {
      mock({
        "/root/packages/a/package.json": "{}",
        "/root/packages/a/package.yaml": "{}",
        "/root/packages/b/package.json": "{}",
      });

      const packages = findAllPackages("/root", ["packages/*"]);
      expect(packages).toEqual(["/root/packages/a", "/root/packages/b"]);
    });

    it("returns empty array when no patterns provided", () => {
      mock({
        "/root/packages/a/package.json": "{}",
      });

      const packages = findAllPackages("/root", []);
      expect(packages).toEqual([]);
    });
  });

  describe("test sortConfigFiles", () => {
    it("sorts config files by depth", () => {
      const files = [
        "/a/b/config.json",
        "/a/b/c/config.json",
        "/a/config.json",
      ];
      const sorted = sortConfigFiles(files);
      expect(sorted).toEqual([
        "/a/b/c/config.json",
        "/a/b/config.json",
        "/a/config.json",
      ]);
    });

    it("sorts files at same depth alphabetically reversed", () => {
      const files = [
        "/a/b/config1.json",
        "/a/b/config2.json",
        "/a/b/config3.json",
      ];
      const sorted = sortConfigFiles(files);
      expect(sorted).toEqual([
        "/a/b/config3.json",
        "/a/b/config2.json",
        "/a/b/config1.json",
      ]);
    });

    it("prioritizes tsconfig over jsconfig at same depth", () => {
      const files = ["/a/b/jsconfig.json", "/a/b/tsconfig.json"];
      const sorted = sortConfigFiles(files, "tsconfig.json");
      expect(sorted).toEqual(["/a/b/tsconfig.json", "/a/b/jsconfig.json"]);
    });

    it("prioritizes depth over tsconfig filename", () => {
      const files = [
        "/a/b/jsconfig.json",
        "/a/b/c/tsconfig.json",
        "/a/b/tsconfig.json",
      ];
      const sorted = sortConfigFiles(files, "tsconfig.json");
      expect(sorted).toEqual([
        "/a/b/c/tsconfig.json",
        "/a/b/tsconfig.json",
        "/a/b/jsconfig.json",
      ]);
    });

    it("handles empty array", () => {
      const sorted = sortConfigFiles([]);
      expect(sorted).toEqual([]);
    });
  });

  describe("test getConfigFiles", () => {
    beforeEach(() => {
      mock.restore();
    });

    it("returns undefined for falsy config", () => {
      const [filename, configFiles] = getConfigFiles(undefined, "/root", {
        filename: "config.json",
      });
      expect(filename).toBeUndefined();
      expect(configFiles).toBeUndefined();
    });

    it("handles string config", () => {
      mock({
        "/root/a/custom.json": "{}",
        "/root/b/custom.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles("custom.json", "/root", {
        filename: "config.json",
        ignore: ["**/node_modules/**"],
      });

      expect(filename).toBe("custom.json");
      expect(configFiles).toEqual([
        "/root/a/custom.json",
        "/root/b/custom.json",
      ]);
    });

    it("handles boolean config", () => {
      mock({
        "/root/a/default.json": "{}",
        "/root/b/default.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(true, "/root", {
        filename: "default.json",
        ignore: ["**/node_modules/**"],
      });

      expect(filename).toBe("default.json");
      expect(configFiles).toEqual([
        "/root/a/default.json",
        "/root/b/default.json",
      ]);
    });

    it("handles object config with absolute configFile path", () => {
      const [filename, configFiles] = getConfigFiles(
        { configFile: "/absolute/path/config.json" },
        "/root",
        { filename: "default.json" },
      );
      expect(filename).toBe("config.json");
      expect(configFiles).toEqual(["/absolute/path/config.json"]);
    });

    it("handles object config with relative configFile path", () => {
      mock({
        "/root/a/custom.json": "{}",
        "/root/b/custom.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(
        { configFile: "custom.json" },
        "/root",
        { filename: "default.json" },
      );

      expect(filename).toBe("custom.json");
      expect(configFiles).toEqual([
        "/root/a/custom.json",
        "/root/b/custom.json",
      ]);
    });

    it("handles object config without configFile", () => {
      mock({
        "/root/a/default.json": "{}",
        "/root/b/default.json": "{}",
        "/root/node_modules/c/default.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(
        { ignore: ["**/node_modules/**"] },
        "/root",
        { filename: "default.json" },
      );

      expect(filename).toBe("default.json");
      expect(configFiles).toEqual([
        "/root/a/default.json",
        "/root/b/default.json",
      ]);
    });

    it("uses default ignore patterns when not specified", () => {
      mock({
        "/root/a/config.json": "{}",
        "/root/node_modules/b/config.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(true, "/root", {
        filename: "config.json",
        ignore: ["**/node_modules/**"],
      });

      expect(filename).toBe("config.json");
      expect(configFiles).toEqual(["/root/a/config.json"]);
    });

    it("returns empty array when no config files found", () => {
      mock({
        "/root/src/index.ts": "",
      });

      const [filename, configFiles] = getConfigFiles(true, "/root", {
        filename: "nonexistent.json",
      });

      expect(filename).toBe("nonexistent.json");
      expect(configFiles).toEqual([]);
    });
  });

  describe("test normalizeConfigFileOptions", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ignore: _, ...restDefaultOptions } = defaultConfigFileOptions;

    it("returns undefined when both tsconfig and jsconfig are falsy", () => {
      const configs = {
        tsconfig: undefined,
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );
      expect(result).toBeUndefined();
    });

    it("handles single tsconfig file", () => {
      mock({
        "/root/tsconfig.json": "{}",
      });

      const configs = {
        tsconfig: true,
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "/root/tsconfig.json",
      });
    });

    it("handles single jsconfig file", () => {
      mock({
        "/root/jsconfig.json": "{}",
      });

      const configs = {
        tsconfig: undefined,
        jsconfig: true,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "/root/jsconfig.json",
      });
    });

    it("prioritizes closest config file when multiple exist", () => {
      mock({
        "/root/tsconfig.json": "{}",
        "/root/src/tsconfig.json": "{}",
        "/root/src/lib/tsconfig.json": "{}",
      });

      const configs = {
        tsconfig: true,
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/lib/file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "/root/src/lib/tsconfig.json",
      });
    });

    it("prioritizes tsconfig over jsconfig at same depth", () => {
      mock({
        "/root/src/tsconfig.json": "{}",
        "/root/src/jsconfig.json": "{}",
      });

      const configs = {
        tsconfig: true,
        jsconfig: true,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "/root/src/tsconfig.json",
      });
    });

    it("returns undefined when no config files found", () => {
      mock({
        "/root/src/file.ts": "",
      });

      const configs = {
        tsconfig: true,
        jsconfig: true,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );
      expect(result).toBeUndefined();
    });

    it("uses cache for subsequent calls", () => {
      process.env.NEXT_RESOLVER_CACHE_DISABLED = "";

      mock({
        "/root/tsconfig.json": "{}",
      });

      const configs = {
        tsconfig: true,
        jsconfig: undefined,
      };

      const firstCall = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );

      // Add new config file after first call
      mock({
        "/root/tsconfig.json": "{}",
        "/root/src/tsconfig.json": "{}",
      });

      const secondCall = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );

      // Should return same result from cache
      expect(secondCall).toEqual(firstCall);

      process.env.NEXT_RESOLVER_CACHE_DISABLED = "1";
    });

    it("handles custom config file paths", () => {
      mock({
        "/root/custom.json": "{}",
      });

      const configs = {
        tsconfig: "custom.json",
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "/root/custom.json",
      });
    });

    it("handles config options object", () => {
      mock({
        "/root/custom.json": "{}",
      });

      const configs = {
        tsconfig: {
          configFile: "custom.json",
          ignore: ["**/dist/**"],
        },
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/src/file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "/root/custom.json",
      });
    });

    it("handles custom config file paths with ignore patterns", () => {
      mock({
        "/root/custom.json": "{}",
        "/root/dist/custom.json": "{}",
      });

      const configs = {
        tsconfig: {
          configFile: "custom.json",
          ignore: ["**/dist/**"],
        },
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "/root",
        "/root/dist/file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "/root/custom.json",
      });
    });
  });

  describe("test findWorkspacePackages", () => {
    beforeEach(() => {
      mock.restore();
    });

    it("returns sorted roots when no packages provided", () => {
      const roots = ["/root/a", "/root/b", "/root/c/d"];
      const result = findWorkspacePackages(roots);
      expect(result).toEqual(["/root/c/d", "/root/b", "/root/a"]);
    });

    it("finds packages with string array patterns", () => {
      mock({
        "/root1/packages/a/package.json": "{}",
        "/root1/packages/b/package.json": "{}",
        "/root2/packages/c/package.json": "{}",
      });

      const roots = ["/root1", "/root2"];
      const packages = ["packages/*"];

      const result = findWorkspacePackages(roots, packages);
      expect(result).toEqual([
        "/root2/packages/c",
        "/root1/packages/b",
        "/root1/packages/a",
      ]);
    });

    it("finds packages with PackageOptions", () => {
      mock({
        "/root1/packages/a/package.json": "{}",
        "/root1/node_modules/b/package.json": "{}",
        "/root2/packages/c/package.json": "{}",
        "/root2/node_modules/d/package.json": "{}",
      });

      const roots = ["/root1", "/root2"];
      const packages = {
        patterns: ["packages/*"],
        ignore: ["**/node_modules/**"],
      };

      const result = findWorkspacePackages(roots, packages);
      expect(result).toEqual(["/root2/packages/c", "/root1/packages/a"]);
    });

    it("removes duplicate packages across roots", () => {
      mock({
        "/root1/packages/shared/package.json": "{}",
        "/root2/packages/shared/package.json": "{}",
        "/root1/packages/unique/package.json": "{}",
      });

      const roots = ["/root1", "/root2"];
      const packages = ["packages/*"];

      const result = findWorkspacePackages(roots, packages);
      expect(result).toEqual([
        "/root2/packages/shared",
        "/root1/packages/unique",
        "/root1/packages/shared",
      ]);
    });

    it("handles empty roots array", () => {
      const result = findWorkspacePackages([]);
      expect(result).toEqual([]);
    });

    it("handles empty package patterns", () => {
      mock({
        "/root1/package.json": "{}",
        "/root2/package.json": "{}",
      });

      const roots = ["/root1", "/root2"];
      const packages = { patterns: [] };

      const result = findWorkspacePackages(roots, packages);
      expect(result).toEqual([]);
    });
  });
});
