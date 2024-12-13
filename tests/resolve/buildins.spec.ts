import { createNextImportResolver, resolve } from "@/resolve";

describe("resolve buildins", () => {
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

  it("with node: prefix", () => {
    expect(resolve("node:fs", "/src/source.js")).deep.equal({
      found: true,
      path: null,
    });

    expect(resolverV3.resolve("node:fs", "/src/source.js")).deep.equal({
      found: true,
      path: null,
    });
  });

  it("with non-exist module name", () => {
    expect(resolve("non-exist-module", "/src/source.js")).deep.equal({
      found: false,
    });

    expect(resolverV3.resolve("non-exist-module", "/src/source.js")).deep.equal(
      {
        found: false,
      },
    );
  });
});
