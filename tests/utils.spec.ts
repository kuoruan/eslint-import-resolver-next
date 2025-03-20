import {
  findClosestConfigFile,
  findClosestPackageRoot,
  hashObject,
  normalizeAlias,
  normalizePatterns,
  sortPathsByDepth,
} from "@/utils";

describe("test normalize patterns", () => {
  it("normalize patterns on Windows", () => {
    if (process.platform === "win32") {
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
    } else {
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
    }
  });
});

describe("test sort paths", () => {
  it("sort paths by depth", () => {
    if (process.platform === "win32") {
      const paths = ["C:\\a\\b\\c", "C:\\a\\b", "C:\\a", "C:\\"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["C:\\a\\b\\c", "C:\\a\\b", "C:\\a", "C:\\"]);
    } else {
      const paths = ["/a/b/c", "/a/b", "/a", "/"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["/a/b/c", "/a/b", "/a", "/"]);
    }
  });

  it("sort paths with same depth reversed alphabetically", () => {
    if (process.platform === "win32") {
      const paths = ["C:\\a\\b", "C:\\a\\a", "C:\\a\\c"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["C:\\a\\c", "C:\\a\\b", "C:\\a\\a"]);
    } else {
      const paths = ["/a/b", "/a/a", "/a/c"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["/a/c", "/a/b", "/a/a"]);
    }
  });

  it("sort paths with mixed depths and root", () => {
    if (process.platform === "win32") {
      const paths = ["C:\\a\\b\\c", "C:\\a\\b", "C:\\", "C:\\a"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["C:\\a\\b\\c", "C:\\a\\b", "C:\\a", "C:\\"]);
    } else {
      const paths = ["/a/b/c", "/a/b", "/", "/a"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["/a/b/c", "/a/b", "/a", "/"]);
    }
  });

  it("sort paths with mixed depths and root and reversed alphabetically", () => {
    if (process.platform === "win32") {
      const paths = ["C:\\a\\b\\c", "C:\\a\\c", "C:\\a\\b", "C:\\a\\a", "C:\\"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual([
        "C:\\a\\b\\c",
        "C:\\a\\c",
        "C:\\a\\b",
        "C:\\a\\a",
        "C:\\",
      ]);
    } else {
      const paths = ["/a/b/c", "/a/b", "/", "/a/a", "/a/c"];
      const sortedPaths = sortPathsByDepth(paths);
      expect(sortedPaths).toEqual(["/a/b/c", "/a/c", "/a/b", "/a/a", "/"]);
    }
  });
});

describe("test findClosestPackageRoot", () => {
  it("find closest package root", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const paths = ["C:\\a\\b\\c", "C:\\a\\b", "C:\\a"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("C:\\a\\b\\c");
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const paths = ["/a/b/c", "/a/b", "/a"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("/a/b/c");
    }
  });

  it("find closest package root with root path", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const paths = ["C:\\a\\b\\c", "C:\\a\\b", "C:\\"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("C:\\a\\b\\c");
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const paths = ["/a/b/c", "/a/b", "/"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("/a/b/c");
    }
  });

  it("find closest package root with no match", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const paths = ["C:\\x\\y", "C:\\z"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBeUndefined();
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const paths = ["/x/y", "/z"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBeUndefined();
    }
  });

  it("find closest package root with multiple matches", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const paths = ["C:\\a\\b\\c\\d", "C:\\a\\b\\c", "C:\\a\\b", "C:\\a"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("C:\\a\\b\\c\\d");
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const paths = ["/a/b/c/d", "/a/b/c", "/a/b", "/a"];
      const closestRoot = findClosestPackageRoot(sourceFile, paths);
      expect(closestRoot).toBe("/a/b/c/d");
    }
  });
});

describe("test findClosestConfigFile", () => {
  it("find closest config file", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = ["C:\\a\\b\\c\\config.json", "C:\\a\\b\\config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\c\\config.json");
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = [
        "/a/b/c/config.json",
        "/a/b/config.json",
        "/a/config.json",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/c/config.json");
    }
  });

  it("find closest config file with root path", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = ["C:\\a\\b\\config.json", "C:\\config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\config.json");
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = ["/a/b/config.json", "/config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/config.json");
    }
  });

  it("find closest config file with no match", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = ["C:\\x\\y\\config.json", "C:\\z\\config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBeUndefined();
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = ["/x/y/config.json", "/z/config.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBeUndefined();
    }
  });

  it("find closest config file with multiple matches", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = [
        "C:\\a\\config.json",
        "C:\\a\\b\\config.json",
        "C:\\a\\b\\c\\config.json",
        "C:\\a\\b\\c\\d\\config.json",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\c\\d\\config.json");
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = [
        "/a/b/c/d/config.json",
        "/a/b/c/config.json",
        "/a/b/config.json",
        "/a/config.json",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/c/d/config.json");
    }
  });

  it("find closest config file with different extensions", () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = [
        "C:\\a\\b\\config.json",
        "C:\\a\\config.yaml",
        "C:\\config.json5",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\config.json");
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = [
        "/a/b/config.json",
        "/a/config.yaml",
        "/config.json5",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/config.json");
    }
  });

  it('find closest config file with "tsconfig" filename', () => {
    if (process.platform === "win32") {
      const sourceFile = "C:\\a\\b\\c\\d\\file.ts";
      const configFiles = [
        "C:\\a\\b\\c\\tsconfig.json",
        "C:\\a\\b\\c\\jsconfig.json",
      ];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("C:\\a\\b\\c\\tsconfig.json");
    } else {
      const sourceFile = "/a/b/c/d/file.ts";
      const configFiles = ["/a/b/c/tsconfig.json", "/a/b/c/jsconfig.json"];
      const closestConfig = findClosestConfigFile(sourceFile, configFiles);
      expect(closestConfig).toBe("/a/b/c/tsconfig.json");
    }
  });
});

describe("test normalize alias", () => {
  it("normalize alias with absolute paths", () => {
    if (process.platform === "win32") {
      const alias = {
        "@components": "D:\\src\\components",
        "@utils": "D:\\src\\utils",
      };
      const normalizedAlias = normalizeAlias(alias, "C:\\");
      expect(normalizedAlias).toEqual({
        "@components": ["D:\\src\\components"],
        "@utils": ["D:\\src\\utils"],
      });
    } else {
      const alias = {
        "@components": "/src/components",
        "@utils": "/src/utils",
      };

      const normalizedAlias = normalizeAlias(alias, "/");
      expect(normalizedAlias).toEqual({
        "@components": ["/src/components"],
        "@utils": ["/src/utils"],
      });
    }
  });

  it("normalize alias with relative paths", () => {
    const alias = {
      "@components": "src/components",
      "@utils": "src/utils",
    };
    if (process.platform === "win32") {
      const normalizedAlias = normalizeAlias(alias, "D:\\project");
      expect(normalizedAlias).toEqual({
        "@components": ["D:\\project\\src\\components"],
        "@utils": ["D:\\project\\src\\utils"],
      });
    } else {
      const normalizedAlias = normalizeAlias(alias, "/home/project");
      expect(normalizedAlias).toEqual({
        "@components": ["/home/project/src/components"],
        "@utils": ["/home/project/src/utils"],
      });
    }
  });

  it("normalize alias with mixed paths", () => {
    const alias = {
      "@components": ["/src/components", "src/extra-components"],
      "@utils": "src/utils",
    };

    if (process.platform === "win32") {
      const normalizedAlias = normalizeAlias(alias, "D:\\project");
      expect(normalizedAlias).toEqual({
        "@components": [
          "/src/components",
          "D:\\project\\src\\extra-components",
        ],
        "@utils": ["D:\\project\\src\\utils"],
      });
    } else {
      const normalizedAlias = normalizeAlias(alias, "/home/project");
      expect(normalizedAlias).toEqual({
        "@components": [
          "/src/components",
          "/home/project/src/extra-components",
        ],
        "@utils": ["/home/project/src/utils"],
      });
    }
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
