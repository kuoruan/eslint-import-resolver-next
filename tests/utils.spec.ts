import process from "node:process";

import {
  hasBunPrefix,
  hashObject,
  hasNodePrefix,
  isNodeBuiltin,
  removeQueryString,
  unique,
} from "@/utils.js";

describe("utils", () => {
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

  describe("test hasNodePrefix", () => {
    it("returns true for node: prefix", () => {
      expect(hasNodePrefix("node:fs")).toBe(true);
      expect(hasNodePrefix("node:path")).toBe(true);
      expect(hasNodePrefix("node:foo")).toBe(true);
    });

    it("returns false for no prefix", () => {
      expect(hasNodePrefix("fs")).toBe(false);
      expect(hasNodePrefix("path")).toBe(false);
    });

    it("returns false for other prefixes", () => {
      expect(hasNodePrefix("bun:fs")).toBe(false);
      expect(hasNodePrefix("https://example.com")).toBe(false);
    });

    it("handles empty string", () => {
      expect(hasNodePrefix("")).toBe(false);
    });
  });

  describe("test hasBunPrefix", () => {
    it("returns true for bun: prefix", () => {
      expect(hasBunPrefix("bun:fs")).toBe(true);
      expect(hasBunPrefix("bun:path")).toBe(true);
      expect(hasBunPrefix("bun:foo")).toBe(true);
    });

    it("returns false for no prefix", () => {
      expect(hasBunPrefix("fs")).toBe(false);
      expect(hasBunPrefix("path")).toBe(false);
    });

    it("returns false for other prefixes", () => {
      expect(hasBunPrefix("node:fs")).toBe(false);
      expect(hasBunPrefix("https://example.com")).toBe(false);
    });

    it("handles empty string", () => {
      expect(hasBunPrefix("")).toBe(false);
    });
  });

  describe("test isNodeBuiltin", () => {
    it("returns true for node builtin modules with node: prefix", () => {
      expect(isNodeBuiltin("node:fs")).toBe(true);
      expect(isNodeBuiltin("node:path")).toBe(true);
      expect(isNodeBuiltin("node:foo")).toBe(false);
    });

    it("returns true for node builtin modules without node: prefix", () => {
      expect(isNodeBuiltin("fs")).toBe(true);
      expect(isNodeBuiltin("path")).toBe(true);
    });

    it("returns false for non-builtin modules", () => {
      expect(isNodeBuiltin("foo")).toBe(false);
      expect(isNodeBuiltin("my-module")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isNodeBuiltin("")).toBe(false);
    });

    it("returns false for bun: prefixed modules", () => {
      expect(isNodeBuiltin("bun:fs")).toBe(false);
    });
  });

  describe("test getResolveRoots", () => {
    const originalProcessCwd = process.cwd.bind(null);
    let mockCwd: string;

    beforeEach(() => {
      mockCwd = "/mock/cwd";
      process.cwd = () => mockCwd;
    });

    afterEach(() => {
      process.cwd = originalProcessCwd;
      vi.resetModules();
      vi.clearAllMocks();
    });

    it("returns the provided roots if given", async () => {
      const { getResolveRoots } = await import("@/utils.js");
      const roots = ["/foo/bar", "/baz"];
      expect(getResolveRoots(roots)).toEqual(roots);
    });

    it("returns context.cwd if available (mock eslint-import-context)", async () => {
      vi.doMock("eslint-import-context", () => ({
        useRuleContext: () => ({ cwd: "/context/cwd" }),
      }));
      const { getResolveRoots } = await import("@/utils.js");
      expect(getResolveRoots()).toEqual(["/context/cwd"]);
    });

    it("returns process.cwd() if context is undefined (mock eslint-import-context)", async () => {
      vi.doMock("eslint-import-context", () => ({
        useRuleContext: () => undefined,
      }));
      const { getResolveRoots } = await import("@/utils.js");
      expect(getResolveRoots()).toEqual([mockCwd]);
    });

    it("returns process.cwd() if cwd is not available (mock eslint-import-context)", async () => {
      vi.doMock("eslint-import-context", () => ({
        useRuleContext: () => ({}),
      }));
      const { getResolveRoots } = await import("@/utils.js");
      expect(getResolveRoots()).toEqual([mockCwd]);
    });
  });
});
