import mock from "mock-fs";

import { defaultConfigFileOptions } from "@/constants";
import {
  findAllPackages,
  findClosestConfigFile,
  findClosestPackageRoot,
  findWorkspacePackages,
  getConfigFiles,
  getPathDepth,
  hashObject,
  normalizeAlias,
  normalizeConfigFileOptions,
  normalizePackageGlobOptions,
  normalizePatterns,
  readYamlFile,
  removeQueryString,
  sortConfigFiles,
  sortPathsByDepth,
  unique,
} from "@/utils";

process.env.NEXT_RESOLVER_CACHE_DISABLED = "1";

describe.runIf(process.platform === "win32")("utils (Windows)", () => {
  describe("test unique", () => {
    it("removes duplicates from array", () => {
      const arr = [1, 2, 2, 3, 3, 3, 4];
      const result = unique(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("handles empty array", () => {
      const arr: number[] = [];
      const result = unique(arr);
      expect(result).toEqual([]);
    });

    it("handles array with no duplicates", () => {
      const arr = [1, 2, 3, 4];
      const result = unique(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("handles array with string values", () => {
      const arr = ["a", "b", "b", "c", "c", "c"];
      const result = unique(arr);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("preserves order of first occurrence", () => {
      const arr = ["b", "a", "b", "c", "a"];
      const result = unique(arr);
      expect(result).toEqual(["b", "a", "c"]);
    });
  });

  describe("test removeQueryString", () => {
    it("removes query string from path", () => {
      expect(removeQueryString("module?query")).toBe("module");
      expect(removeQueryString("module?query=value")).toBe("module");
    });

    it("handles path with no query string", () => {
      const modulePath = "module";
      const result = removeQueryString(modulePath);
      expect(result).toBe("module");
    });

    it("handles path with multiple question marks", () => {
      const modulePath = "module?query=value?more=params";
      const result = removeQueryString(modulePath);
      expect(result).toBe("module");
    });

    it("handles empty path", () => {
      const modulePath = "";
      const result = removeQueryString(modulePath);
      expect(result).toBe("");
    });

    it("handles path with query string containing special characters", () => {
      const modulePath = "module?query=value&param=123#hash";
      const result = removeQueryString(modulePath);
      expect(result).toBe("module");
    });
  });

  describe("test normalize patterns", () => {
    it("normalize patterns on Windows", () => {
      const result1 = normalizePatterns(["C:\\path\\to\\pattern"]);
      const result2 = normalizePatterns(["C:\\", "C:\\path\\to\\"]);
      const result3 = normalizePatterns(["C:/path/to/pattern"]);
      const result4 = normalizePatterns(["C:\\path\\*", "C:\\to\\**"]);
      const result5 = normalizePatterns(["C:\\path\\*\\", "C:\\to\\**\\"]);

      expect(result1).toEqual([
        "C:/path/to/pattern/package.json",
        "C:/path/to/pattern/package.json5",
        "C:/path/to/pattern/package.yaml",
      ]);
      expect(result2).toEqual([
        "C:/package.json",
        "C:/package.json5",
        "C:/package.yaml",
        "C:/path/to/package.json",
        "C:/path/to/package.json5",
        "C:/path/to/package.yaml",
      ]);
      expect(result3).toEqual([
        "C:/path/to/pattern/package.json",
        "C:/path/to/pattern/package.json5",
        "C:/path/to/pattern/package.yaml",
      ]);
      expect(result4).toEqual([
        "C:/path/*/package.json",
        "C:/path/*/package.json5",
        "C:/path/*/package.yaml",
        "C:/to/**/package.json",
        "C:/to/**/package.json5",
        "C:/to/**/package.yaml",
      ]);
      expect(result5).toEqual([
        "C:/path/*/package.json",
        "C:/path/*/package.json5",
        "C:/path/*/package.yaml",
        "C:/to/**/package.json",
        "C:/to/**/package.json5",
        "C:/to/**/package.yaml",
      ]);
    });
  });

  describe("test getPathDepth", () => {
    it("returns 0 for empty path", () => {
      expect(getPathDepth("")).toBe(0);
    });

    it("returns correct depth for absolute paths", () => {
      expect(getPathDepth("\\")).toBe(0);
      expect(getPathDepth("C:\\")).toBe(0);
      expect(getPathDepth("C:\\foo")).toBe(1);
      expect(getPathDepth("C:\\foo\\bar")).toBe(2);
      expect(getPathDepth("C:\\foo\\bar\\baz")).toBe(3);
    });

    it("returns correct depth for relative paths", () => {
      expect(getPathDepth("foo")).toBe(1);
      expect(getPathDepth("foo\\bar")).toBe(2);
      expect(getPathDepth("foo\\bar\\baz")).toBe(3);
    });

    it("handles consecutive separators", () => {
      expect(getPathDepth("C:\\\\foo\\\\bar")).toBe(2);
      expect(getPathDepth("foo\\\\bar\\\\baz")).toBe(3);
    });
  });

  describe("test sort paths", () => {
    it("sort paths by depth", () => {
      const paths = ["C:\\a\\b\\c", "C:\\a\\b", "C:\\a", "C:\\"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["C:\\a\\b\\c", "C:\\a\\b", "C:\\a", "C:\\"]);
    });

    it("sort paths with same depth reversed alphabetically", () => {
      const paths = ["C:\\a\\b", "C:\\a\\a", "C:\\a\\c"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["C:\\a\\c", "C:\\a\\b", "C:\\a\\a"]);
    });

    it("sort paths with mixed depths and root", () => {
      const paths = ["C:\\a\\b\\c", "C:\\a\\b", "C:\\", "C:\\a"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["C:\\a\\b\\c", "C:\\a\\b", "C:\\a", "C:\\"]);
    });

    it("sort paths with mixed depths and root and reversed alphabetically", () => {
      const paths = ["C:\\a\\b\\c", "C:\\a\\c", "C:\\a\\b", "C:\\a\\a", "C:\\"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual([
        "C:\\a\\b\\c",
        "C:\\a\\c",
        "C:\\a\\b",
        "C:\\a\\a",
        "C:\\",
      ]);
    });
  });

  describe("test readYamlFile", () => {
    beforeEach(() => {
      mock.restore();
    });

    it("read yaml file", () => {
      mock({
        "C:\\path\\to\\file.yaml": "key: value",
      });

      const data = readYamlFile("C:\\path\\to\\file.yaml");
      expect(data).toEqual({ key: "value" });
    });

    it("returns null for non-existent file", () => {
      const data = readYamlFile("C:\\non\\existent\\file.yaml");
      expect(data).toBeNull();
    });

    it("returns cached value if available", () => {
      process.env.NEXT_RESOLVER_CACHE_DISABLED = "";

      mock({
        "C:\\path\\to\\file1.yaml": "key: cached-value",
      });

      // First read to populate cache
      const firstRead = readYamlFile("C:\\path\\to\\file1.yaml");
      expect(firstRead).toEqual({ key: "cached-value" });

      // Change file content
      mock({
        "C:\\path\\to\\file1.yaml": "key: new-value",
      });

      // Second read should return cached value
      const secondRead = readYamlFile("C:\\path\\to\\file1.yaml");
      expect(secondRead).toEqual({ key: "cached-value" });

      process.env.NEXT_RESOLVER_CACHE_DISABLED = "1";
    });

    it("read complex yaml file", () => {
      mock({
        "C:\\path\\to\\file2.yaml": `
        key1: value1
        key2:
          - item1
          - item2
        key3:
          subkey1: subvalue1
          subkey2: subvalue2
      `,
      });

      const data = readYamlFile("C:\\path\\to\\file2.yaml");
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
        "C:\\path\\to\\file3.yaml": `
          packages:
            - package1
            - package2
        `,
      });

      const data = readYamlFile("C:\\path\\to\\file3.yaml");
      expect(data).toEqual({
        packages: ["package1", "package2"],
      });
    });

    it("read yaml file with empty content", () => {
      mock({
        "C:\\path\\to\\file4.yaml": "",
      });

      const data = readYamlFile("C:\\path\\to\\file4.yaml");
      expect(data).toEqual(null);
    });

    it("read invalid yaml file", () => {
      mock({
        "C:\\path\\to\\file5.yaml": "key: value\nkey2",
      });

      expect(readYamlFile("C:\\path\\to\\file5.yaml")).toEqual(null);
    });
  });

  describe("test findClosestPackageRoot", () => {
    it("find closest package root", () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const paths = ["C:\\a\\b\\c", "C:\\a\\b", "C:\\a"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("C:\\a\\b\\c");
    });

    it("find closest package root with root path", () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const paths = ["C:\\a\\b\\c", "C:\\a\\b", "C:\\"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("C:\\a\\b\\c");
    });

    it("find closest package root with no match", () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const paths = ["C:\\x\\y", "C:\\z"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBeUndefined();
    });

    it("find closest package root with multiple matches", () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const paths = ["C:\\a\\b\\c\\d", "C:\\a\\b\\c", "C:\\a\\b", "C:\\a"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("C:\\a\\b\\c\\d");
    });
  });

  describe("test findClosestConfigFile", () => {
    it("find closest config file", () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = ["C:\\a\\b\\c\\config.json", "C:\\a\\b\\config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\c\\config.json");
    });

    it("find closest config file with root path", () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = ["C:\\a\\b\\config.json", "C:\\config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\config.json");
    });

    it("find closest config file with no match", () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = ["C:\\x\\y\\config.json", "C:\\z\\config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBeUndefined();
    });

    it("find closest config file with multiple matches", () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = [
        "C:\\a\\b\\c\\d\\config.json",
        "C:\\a\\b\\c\\config.json",
        "C:\\a\\b\\config.json",
        "C:\\a\\config.json",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\c\\d\\config.json");
    });

    it('find closest config file with "tsconfig" filename', () => {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = [
        "C:\\a\\b\\c\\tsconfig.json",
        "C:\\a\\b\\c\\jsconfig.json",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\c\\tsconfig.json");
    });
  });

  describe("test normalize alias", () => {
    it("normalize alias with absolute paths", () => {
      const alias = {
        "@components": "D:\\src\\components",
        "@utils": "D:\\src\\utils",
      };
      const normalizedAlias = normalizeAlias(alias, "C:\\");
      expect(normalizedAlias).toEqual({
        "@components": ["D:\\src\\components"],
        "@utils": ["D:\\src\\utils"],
      });
    });

    it("normalize alias with relative paths", () => {
      const alias = {
        "@components": "src/components",
        "@utils": "src/utils",
      };
      const normalizedAlias = normalizeAlias(alias, "D:\\project");
      expect(normalizedAlias).toEqual({
        "@components": ["D:\\project\\src\\components"],
        "@utils": ["D:\\project\\src\\utils"],
      });
    });

    it("normalize alias with mixed paths", () => {
      const alias = {
        "@components": ["/src/components", "src/extra-components"],
        "@utils": "src/utils",
      };

      const normalizedAlias = normalizeAlias(alias, "D:\\project");
      expect(normalizedAlias).toEqual({
        "@components": [
          "/src/components",
          "D:\\project\\src\\extra-components",
        ],
        "@utils": ["D:\\project\\src\\utils"],
      });
    });

    it("normalize alias with no alias", () => {
      const normalizedAlias = normalizeAlias(undefined, "/");
      expect(normalizedAlias).toBeUndefined();
    });
  });

  describe("test hash object", () => {
    it("hash object", () => {
      const obj = {
        a: 1,
        b: "string",
        c: [1, 2, 3],
        d: { e: "f" },
      };

      const hash = hashObject(obj);
      expect(hash).toMatchSnapshot();
    });

    it("hash object multiple times with same result", () => {
      const obj = {
        a: 1,
        b: "string",
        c: [1, 2, 3],
        d: { e: "f" },
      };

      const hash1 = hashObject(obj);
      const hash2 = hashObject(obj);
      expect(hash1).toBe(hash2);
    });

    it("hash object with different order", () => {
      const obj1 = {
        a: 1,
        b: "string",
        c: [1, 2, 3],
        d: { e: "f" },
      };

      const obj2 = {
        b: "string",
        a: 1,
        d: { e: "f" },
        c: [1, 2, 3],
      };

      const hash1 = hashObject(obj1);
      const hash2 = hashObject(obj2);
      expect(hash1).toBe(hash2);
    });

    it("hash object with different values", () => {
      const obj1 = {
        a: 1,
        b: "string",
        c: [1, 2, 3],
        d: { e: "f" },
      };

      const obj2 = {
        a: 2,
        b: "string",
        c: [1, 2, 3],
        d: { e: "f" },
      };

      const hash1 = hashObject(obj1);
      const hash2 = hashObject(obj2);
      expect(hash1).not.toBe(hash2);
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
        "C:\\root\\pnpm-workspace.yaml": `
          packages:
            - packages/*
            - apps/*
        `,
      });

      const opts = { pnpmWorkspace: true };
      const result = normalizePackageGlobOptions(opts, "C:\\root");
      expect(result).toEqual({
        patterns: ["packages/*", "apps/*"],
      });
    });

    it("reads custom pnpm workspace file path", () => {
      mock({
        "C:\\root\\custom-workspace.yaml": `
        packages:
          - custom-packages/*
          - custom-apps/*
      `,
      });

      const opts = { pnpmWorkspace: "custom-workspace.yaml" };
      const result = normalizePackageGlobOptions(opts, "C:\\root");
      expect(result).toEqual({
        patterns: ["custom-packages/*", "custom-apps/*"],
      });
    });

    it("merges patterns from pnpm workspace and explicit patterns", () => {
      mock({
        "C:\\root\\pnpm-workspace.yaml": `
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
      const result = normalizePackageGlobOptions(opts, "C:\\root");
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
      const result = normalizePackageGlobOptions(opts, "C:\\root");
      expect(result).toEqual({
        ignore: ["**/node_modules/**"],
        expandDirectories: false,
      });
    });

    it("handles empty or invalid pnpm workspace file", () => {
      mock({
        "C:\\root\\pnpm-workspace.yaml": "",
      });

      const opts = { pnpmWorkspace: true };

      const result = normalizePackageGlobOptions(opts, "C:\\root");
      expect(result).toEqual({});
    });

    it("removes duplicate patterns", () => {
      mock({
        "C:\\root\\pnpm-workspace.yaml": `
          packages:
            - packages/*
            - apps/*
        `,
      });

      const opts = {
        pnpmWorkspace: true,
        patterns: ["packages/*", "extra/*"],
      };
      const result = normalizePackageGlobOptions(opts, "C:\\root");
      expect(result).toEqual({
        patterns: ["packages/*", "apps/*", "extra/*"],
      });
    });

    it("empty patterns when no patterns found", () => {
      const result = normalizePackageGlobOptions([], "C:\\root");

      expect(result).toEqual({ patterns: [] });
    });
  });

  describe("test findAllPackages", () => {
    beforeEach(() => {
      mock.restore();
    });

    it("finds packages with string array patterns", () => {
      mock({
        "C:\\root\\packages\\a\\package.json": "{}",
        "C:\\root\\packages\\b\\package.json": "{}",
        "C:\\root\\apps\\c\\package.json": "{}",
      });

      const packages = findAllPackages("C:\\root", ["packages/*", "apps/*"]);

      expect(packages).toEqual([
        "C:\\root\\apps\\c",
        "C:\\root\\packages\\a",
        "C:\\root\\packages\\b",
      ]);
    });

    it("finds packages with PackageOptions", () => {
      mock({
        "C:\\root\\packages\\a\\package.json": "{}",
        "C:\\root\\packages\\b\\package.json": "{}",
        "C:\\root\\apps\\c\\package.json": "{}",
      });

      const packages = findAllPackages("C:\\root", {
        patterns: ["packages/*", "apps/*"],
      });

      expect(packages).toEqual([
        "C:\\root\\apps\\c",
        "C:\\root\\packages\\a",
        "C:\\root\\packages\\b",
      ]);
    });

    it("includes root package when includeRoot is true", () => {
      mock({
        "C:\\root\\package.json": "{}",
        "C:\\root\\packages\\a\\package.json": "{}",
      });

      const packages = findAllPackages("C:\\root", {
        patterns: ["packages/*"],
        includeRoot: true,
      });
      expect(packages).toEqual(["C:\\root", "C:\\root\\packages\\a"]);
    });

    it("returns empty array when no packages found", () => {
      mock({
        "C:\\root/src/index.ts": "",
      });

      const packages = findAllPackages("C:\\root", ["packages/*"]);
      expect(packages).toEqual([]);
    });

    it("handles multiple package descriptor formats", () => {
      mock({
        "C:\\root\\a\\package.json": "{}",
        "C:\\root\\b\\package.yaml": "name: b",
        "C:\\root\\c\\package.json5": "{}",
      });

      const packages = findAllPackages("C:\\root", ["*"]);
      expect(packages).toEqual(["C:\\root\\a", "C:\\root\\b", "C:\\root\\c"]);
    });

    it("returns cached results on subsequent calls", () => {
      process.env.NEXT_RESOLVER_CACHE_DISABLED = "";

      mock({
        "C:\\root\\packages\\a\\package.json": "{}",
        "C:\\root\\packages\\b\\package.json": "{}",
      });

      const firstCall = findAllPackages("C:\\root", ["packages/*"]);
      expect(firstCall).toEqual([
        "C:\\root\\packages\\a",
        "C:\\root\\packages\\b",
      ]);

      // Add new package after first call
      mock({
        "C:\\root\\packages\\c\\package.json": "{}",
      });

      const secondCall = findAllPackages("C:\\root", ["packages/*"]);
      // Should return cached result, ignoring new package
      expect(secondCall).toEqual([
        "C:\\root\\packages\\a",
        "C:\\root\\packages\\b",
      ]);

      process.env.NEXT_RESOLVER_CACHE_DISABLED = "1";
    });

    it("removes duplicate package paths", () => {
      mock({
        "C:\\root\\packages\\a\\package.json": "{}",
        "C:\\root\\packages\\a\\package.yaml": "{}",
        "C:\\root\\packages\\b\\package.json": "{}",
      });

      const packages = findAllPackages("C:\\root", ["packages/*"]);
      expect(packages).toEqual([
        "C:\\root\\packages\\a",
        "C:\\root\\packages\\b",
      ]);
    });

    it("returns empty array when no patterns provided", () => {
      mock({
        "C:\\root\\packages\\a\\package.json": "{}",
      });

      const packages = findAllPackages("C:\\root", []);
      expect(packages).toEqual([]);
    });
  });

  describe("test sortConfigFiles", () => {
    it("sorts config files by depth", () => {
      const files = [
        "C:\\a\\b\\config.json",
        "C:\\a\\b\\c\\config.json",
        "C:\\a\\config.json",
      ];
      const sorted = sortConfigFiles(files);
      expect(sorted).toEqual([
        "C:\\a\\b\\c\\config.json",
        "C:\\a\\b\\config.json",
        "C:\\a\\config.json",
      ]);
    });

    it("sorts files at same depth alphabetically reversed", () => {
      const files = [
        "C:\\a\\b\\config1.json",
        "C:\\a\\b\\config2.json",
        "C:\\a\\b\\config3.json",
      ];
      const sorted = sortConfigFiles(files);
      expect(sorted).toEqual([
        "C:\\a\\b\\config3.json",
        "C:\\a\\b\\config2.json",
        "C:\\a\\b\\config1.json",
      ]);
    });

    it("prioritizes tsconfig over jsconfig at same depth", () => {
      const files = ["C:\\a\\b\\jsconfig.json", "C:\\a\\b\\tsconfig.json"];
      const sorted = sortConfigFiles(files, "tsconfig.json");
      expect(sorted).toEqual([
        "C:\\a\\b\\tsconfig.json",
        "C:\\a\\b\\jsconfig.json",
      ]);
    });

    it("prioritizes depth over tsconfig filename", () => {
      const files = [
        "C:\\a\\b\\jsconfig.json",
        "C:\\a\\b\\c\\tsconfig.json",
        "C:\\a\\b\\tsconfig.json",
      ];
      const sorted = sortConfigFiles(files, "tsconfig.json");
      expect(sorted).toEqual([
        "C:\\a\\b\\c\\tsconfig.json",
        "C:\\a\\b\\tsconfig.json",
        "C:\\a\\b\\jsconfig.json",
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
        "C:\\root\\a\\custom.json": "{}",
        "C:\\root\\b\\custom.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(
        "custom.json",
        "C:\\root",
        { filename: "config.json" },
      );

      expect(filename).toBe("custom.json");
      expect(configFiles).toEqual([
        "C:\\root\\a\\custom.json",
        "C:\\root\\b\\custom.json",
      ]);
    });

    it("handles boolean config", () => {
      mock({
        "C:\\root\\a\\default.json": "{}",
        "C:\\root\\b\\default.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(true, "C:\\root", {
        filename: "default.json",
        ignore: ["**/node_modules/**"],
      });

      expect(filename).toBe("default.json");
      expect(configFiles).toEqual([
        "C:\\root\\a\\default.json",
        "C:\\root\\b\\default.json",
      ]);
    });

    it("handles object config with absolute configFile path", () => {
      const [filename, configFiles] = getConfigFiles(
        { configFile: "C:\\absolute\\path\\config.json" },
        "C:\\root",
        { filename: "default.json" },
      );
      expect(filename).toBe("config.json");
      expect(configFiles).toEqual(["C:\\absolute\\path\\config.json"]);
    });

    it("handles object config with relative configFile path", () => {
      mock({
        "C:\\root\\a\\custom.json": "{}",
        "C:\\root\\b\\custom.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(
        { configFile: "custom.json" },
        "C:\\root",
        { filename: "default.json" },
      );

      expect(filename).toBe("custom.json");
      expect(configFiles).toEqual([
        "C:\\root\\a\\custom.json",
        "C:\\root\\b\\custom.json",
      ]);
    });

    it("handles object config without configFile", () => {
      mock({
        "C:\\root\\a\\default.json": "{}",
        "C:\\root\\b\\default.json": "{}",
        "C:\\root\\node_modules\\c\\default.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(
        { ignore: ["**/node_modules/**"] },
        "C:\\root",
        { filename: "default.json" },
      );

      expect(filename).toBe("default.json");
      expect(configFiles).toEqual([
        "C:\\root\\a\\default.json",
        "C:\\root\\b\\default.json",
      ]);
    });

    it("uses default ignore patterns when not specified", () => {
      mock({
        "C:\\root\\a\\config.json": "{}",
        "C:\\root\\node_modules\\b\\config.json": "{}",
      });

      const [filename, configFiles] = getConfigFiles(true, "C:\\root", {
        filename: "config.json",
        ignore: ["**/node_modules/**"],
      });

      expect(filename).toBe("config.json");
      expect(configFiles).toEqual(["C:\\root\\a\\config.json"]);
    });

    it("returns empty array when no config files found", () => {
      mock({
        "C:\\root\\src\\index.ts": "",
      });

      const [filename, configFiles] = getConfigFiles(true, "C:\\root", {
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
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );

      expect(result).toBeUndefined();
    });

    it("handles single tsconfig file", () => {
      mock({
        "C:\\root\\tsconfig.json": "{}",
      });

      const configs = {
        tsconfig: true,
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "C:\\root\\tsconfig.json",
      });
    });

    it("handles single jsconfig file", () => {
      mock({
        "C:\\root\\jsconfig.json": "{}",
      });
      const configs = {
        tsconfig: undefined,
        jsconfig: true,
      };
      const result = normalizeConfigFileOptions(
        configs,
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "C:\\root\\jsconfig.json",
      });
    });

    it("prioritizes closest config file when multiple exist", () => {
      mock({
        "C:\\root\\tsconfig.json": "{}",
        "C:\\root\\src\\tsconfig.json": "{}",
        "C:\\root\\src\\lib\\tsconfig.json": "{}",
      });

      const configs = {
        tsconfig: true,
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "C:\\root",
        "C:\\root\\src\\lib\\file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "C:\\root\\src\\lib\\tsconfig.json",
      });
    });

    it("prioritizes tsconfig over jsconfig at same depth", () => {
      mock({
        "C:\\root\\src\\jsconfig.json": "{}",
        "C:\\root\\src\\tsconfig.json": "{}",
      });

      const configs = {
        tsconfig: true,
        jsconfig: true,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "C:\\root\\src\\tsconfig.json",
      });
    });

    it("returns undefined when no config files found", () => {
      mock({
        "C:\\root\\src\\file.ts": "",
      });

      const configs = {
        tsconfig: true,
        jsconfig: true,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );

      expect(result).toBeUndefined();
    });

    it("uses cache for subsequent calls", () => {
      process.env.NEXT_RESOLVER_CACHE_DISABLED = "";
      mock({
        "C:\\root\\tsconfig.json": "{}",
      });

      const configs = {
        tsconfig: true,
        jsconfig: undefined,
      };

      const firstCall = normalizeConfigFileOptions(
        configs,
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );

      // Add new config file after first call
      mock({
        "C:\\root\\tsconfig.json": "{}",
        "C:\\root\\src\\tsconfig.json": "{}",
      });

      const secondCall = normalizeConfigFileOptions(
        configs,
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );

      // Should return same result from cache
      expect(secondCall).toEqual(firstCall);

      process.env.NEXT_RESOLVER_CACHE_DISABLED = "1";
    });

    it("handles custom config file paths", () => {
      mock({
        "C:\\root\\custom.json": "{}",
      });

      const configs = {
        tsconfig: "custom.json",
        jsconfig: undefined,
      };

      const result = normalizeConfigFileOptions(
        configs,
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "C:\\root\\custom.json",
      });
    });

    it("handles config options object", () => {
      mock({
        "C:\\root\\custom.json": "{}",
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
        "C:\\root",
        "C:\\root\\src\\file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "C:\\root\\custom.json",
      });
    });

    it("handles custom config file paths with ignore patterns", () => {
      mock({
        "C:\\root\\custom.json": "{}",
        "C:\\root\\dist\\custom.json": "{}",
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
        "C:\\root",
        "C:\\root\\dist\\file.ts",
      );
      expect(result).toEqual({
        ...restDefaultOptions,
        configFile: "C:\\root\\custom.json",
      });
    });
  });

  describe("test findWorkspacePackages", () => {
    beforeEach(() => {
      mock.restore();
    });

    it("returns sorted roots when no packages provided", () => {
      const roots = ["C:\\root\\a", "C:\\root\\b", "C:\\root\\c\\d"];
      const result = findWorkspacePackages(roots);
      expect(result).toEqual(["C:\\root\\c\\d", "C:\\root\\b", "C:\\root\\a"]);
    });

    it("finds packages with string array patterns", () => {
      mock({
        "C:\\root1\\packages\\a\\package.json": "{}",
        "C:\\root1\\packages\\b\\package.json": "{}",
        "C:\\root2\\packages\\c\\package.json": "{}",
      });

      const roots = ["C:\\root1", "C:\\root2"];
      const packages = ["packages/*"];

      const result = findWorkspacePackages(roots, packages);
      expect(result).toEqual([
        "C:\\root2\\packages\\c",
        "C:\\root1\\packages\\b",
        "C:\\root1\\packages\\a",
      ]);
    });

    it("finds packages with PackageOptions", () => {
      mock({
        "C:\\root1\\packages\\a\\package.json": "{}",
        "C:\\root1\\node_modules\\b\\package.json": "{}",
        "C:\\root2\\packages\\c\\package.json": "{}",
        "C:\\root2\\node_modules\\d\\package.json": "{}",
      });

      const roots = ["C:\\root1", "C:\\root2"];
      const packages = {
        patterns: ["packages/*"],
        ignore: ["**/node_modules/**"],
      };

      const result = findWorkspacePackages(roots, packages);
      expect(result).toEqual([
        "C:\\root2\\packages\\c",
        "C:\\root1\\packages\\a",
      ]);
    });

    it("removes duplicate packages across roots", () => {
      mock({
        "C:\\root1\\packages\\shared\\package.json": "{}",
        "C:\\root2\\packages\\shared\\package.json": "{}",
        "C:\\root1\\packages\\unique\\package.json": "{}",
      });

      const roots = ["C:\\root1", "C:\\root2"];
      const packages = ["packages/*"];

      const result = findWorkspacePackages(roots, packages);
      expect(result).toEqual([
        "C:\\root2\\packages\\shared",
        "C:\\root1\\packages\\unique",
        "C:\\root1\\packages\\shared",
      ]);
    });

    it("handles empty roots array", () => {
      const result = findWorkspacePackages([]);
      expect(result).toEqual([]);
    });

    it("handles empty package patterns", () => {
      mock({
        "C:\\root1\\package.json": "{}",
        "C:\\root2\\package.json": "{}",
      });

      const roots = ["C:\\root1", "C:\\root2"];
      const packages = { patterns: [] };

      const result = findWorkspacePackages(roots, packages);
      expect(result).toEqual([]);
    });
  });
});
