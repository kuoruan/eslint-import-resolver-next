import { getSingleRepoPath } from "@tests/utils";

import resolve from "@/resolve";

describe("test mixed package", () => {
  const sourceFile = getSingleRepoPath("source.js");
  const roots = [getSingleRepoPath()];

  it("with default", () => {
    expect(resolve("mixed-pkg", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/index.js"),
    });
  });

  it('with "index.js"', () => {
    expect(resolve("mixed-pkg/index.js", sourceFile, { roots })).deep.equal({
      found: false,
    });
  });

  it('with "index"', () => {
    expect(resolve("mixed-pkg/index", sourceFile, { roots })).deep.equal({
      found: false,
    });
  });

  it('with "lib"', () => {
    expect(resolve("mixed-pkg/lib", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/lib/index.js"),
    });
  });

  it('with "lib-alias"', () => {
    expect(resolve("mixed-pkg/lib-alias", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/lib/index.js"),
    });
  });

  it('with "export.js"', () => {
    expect(resolve("mixed-pkg/export.js", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/index.js"),
    });
  });
});
