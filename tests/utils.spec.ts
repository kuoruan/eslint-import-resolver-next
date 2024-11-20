import {
  findClosestConfigFile,
  findClosestPackageRoot,
  normalizeAlias,
  normalizePatterns,
  sortPaths,
} from "@/utils";

describe("test normalize patterns", () => {
  it("normalize patterns", () => {
    const result1 = normalizePatterns(["/path/to/pattern"]);
    const result2 = normalizePatterns(["/", "/path/to/"]);

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
  });
});

describe("test sort paths", () => {
  it("sort paths by depth", () => {
    const paths = ["/a/b/c", "/a/b", "/a", "/"];
    const sortedPaths = sortPaths(paths);
    expect(sortedPaths).toEqual(["/a/b/c", "/a/b", "/a", "/"]);
  });

  it("sort paths with same depth reversed alphabetically", () => {
    const paths = ["/a/b", "/a/a", "/a/c"];
    const sortedPaths = sortPaths(paths);
    expect(sortedPaths).toEqual(["/a/c", "/a/b", "/a/a"]);
  });

  it("sort paths with mixed depths and root", () => {
    const paths = ["/a/b/c", "/a/b", "/", "/a"];
    const sortedPaths = sortPaths(paths);
    expect(sortedPaths).toEqual(["/a/b/c", "/a/b", "/a", "/"]);
  });

  it("sort paths with mixed depths and root and reversed alphabetically", () => {
    const paths = ["/a/b/c", "/a/b", "/", "/a/a", "/a/c"];
    const sortedPaths = sortPaths(paths);
    expect(sortedPaths).toEqual(["/a/b/c", "/a/c", "/a/b", "/a/a", "/"]);
  });
});

describe("test findClosestPackageRoot", () => {
  it("find closest package root", () => {
    const sourceFile = "/a/b/c/d/file.ts";
    const paths = ["/a/b", "/a/b/c", "/a"];
    const closestRoot = findClosestPackageRoot(sourceFile, paths);
    expect(closestRoot).toBe("/a/b/c");
  });

  it("find closest package root with root path", () => {
    const sourceFile = "/a/b/c/d/file.ts";
    const paths = ["/", "/a/b", "/a/b/c"];
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
    const paths = ["/a", "/a/b", "/a/b/c", "/a/b/c/d"];
    const closestRoot = findClosestPackageRoot(sourceFile, paths);
    expect(closestRoot).toBe("/a/b/c/d");
  });
});

describe("test findClosestConfigFile", () => {
  it("find closest config file", () => {
    const sourceFile = "/a/b/c/d/file.ts";
    const configFiles = [
      "/a/b/config.json",
      "/a/b/c/config.json",
      "/a/config.json",
    ];
    const closestConfig = findClosestConfigFile(sourceFile, configFiles);
    expect(closestConfig).toBe("/a/b/c/config.json");
  });

  it("find closest config file with root path", () => {
    const sourceFile = "/a/b/c/d/file.ts";
    const configFiles = [
      "/config.json",
      "/a/b/config.json",
      "/a/b/c/config.json",
    ];
    const closestConfig = findClosestConfigFile(sourceFile, configFiles);
    expect(closestConfig).toBe("/a/b/c/config.json");
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
      "/a/config.json",
      "/a/b/config.json",
      "/a/b/c/config.json",
      "/a/b/c/d/config.json",
    ];
    const closestConfig = findClosestConfigFile(sourceFile, configFiles);
    expect(closestConfig).toBe("/a/b/c/d/config.json");
  });

  it("find closest config file with different extensions", () => {
    const sourceFile = "/a/b/c/d/file.ts";
    const configFiles = [
      "/a/b/config.yaml",
      "/a/b/c/config.json",
      "/a/config.json5",
    ];
    const closestConfig = findClosestConfigFile(sourceFile, configFiles);
    expect(closestConfig).toBe("/a/b/c/config.json");
  });
});

describe("test normalize alias", () => {
  it("normalize alias with absolute paths", () => {
    const alias = {
      "@components": "/src/components",
      "@utils": "/src/utils",
    };
    const normalizedAlias = normalizeAlias(alias);
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
      "@components": ["/src/components", "/home/project/src/extra-components"],
      "@utils": ["/home/project/src/utils"],
    });
  });

  it("normalize alias with no alias", () => {
    const normalizedAlias = normalizeAlias(undefined);
    expect(normalizedAlias).toBeUndefined();
  });
});
