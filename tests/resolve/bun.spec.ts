import process from "process";

import { createNextImportResolver, resolve } from "@/resolve";

describe.runIf(!!process.versions.bun)("resolve bun buildins", () => {
  const resolverV3 = createNextImportResolver();

  it("only module name", () => {
    expect(resolve("fs", "/src/source.js")).toEqual({
      found: true,
      path: null,
    });

    expect(resolverV3.resolve("fs", "/src/source.js")).toEqual({
      found: true,
      path: null,
    });
  });

  it("with bun: prefix", () => {
    expect(resolve("bun:sqlite", "/src/source.js")).toEqual({
      found: true,
      path: null,
    });
    expect(resolverV3.resolve("bun:sqlite", "/src/source.js")).toEqual({
      found: true,
      path: null,
    });
  });

  it("with node: prefix", () => {
    expect(resolve("node:fs", "/src/source.js")).toEqual({
      found: true,
      path: null,
    });

    expect(resolverV3.resolve("node:fs", "/src/source.js")).toEqual({
      found: true,
      path: null,
    });
  });

  it("with non-exist module name", () => {
    expect(
      resolverV3.resolve("node:non-exist-module", "/src/source.js"),
    ).toEqual({
      found: false,
    });

    expect(
      resolverV3.resolve("node:non-exist-module", "/src/source.js"),
    ).toEqual({
      found: false,
    });

    expect(resolve("bun:non-exist-module", "/src/source.js")).toEqual({
      found: false,
    });
    expect(
      resolverV3.resolve("bun:non-exist-module", "/src/source.js"),
    ).toEqual({
      found: false,
    });
  });
});
