import resolve from "@/resolve";

describe("resolve buildins", () => {
  it("only module name", () => {
    expect(resolve("fs", "/src/source.js") as unknown).toEqual({
      found: true,
      path: null,
    });
  });

  it("with node: prefix", () => {
    expect(resolve("node:fs", "/src/source.js")).deep.equal({
      found: true,
      path: null,
    });
  });

  it("with non-exist module name", () => {
    expect(resolve("non-exist-module", "/src/source.js")).deep.equal({
      found: false,
    });
  });
});
