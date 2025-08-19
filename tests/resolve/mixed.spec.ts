import { getSingleRepoPath } from "@tests/utils.js";

import { createNextImportResolver, resolve } from "@/resolve.js";

describe("test mixed package", () => {
  const sourceFile = getSingleRepoPath("source.js");
  const roots = [getSingleRepoPath()];

  const resolverV3 = createNextImportResolver({ roots });

  it("with default", () => {
    expect(resolve("mixed-pkg", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/index.js"),
    });

    expect(resolverV3.resolve("mixed-pkg", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/index.js"),
    });
  });

  it('with "index.js"', () => {
    expect(resolve("mixed-pkg/index.js", sourceFile, { roots })).deep.equal({
      found: false,
    });

    expect(resolverV3.resolve("mixed-pkg/index.js", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "index"', () => {
    expect(resolve("mixed-pkg/index", sourceFile, { roots })).deep.equal({
      found: false,
    });

    expect(resolverV3.resolve("mixed-pkg/index", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "lib"', () => {
    expect(resolve("mixed-pkg/lib", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/lib/index.js"),
    });

    expect(resolverV3.resolve("mixed-pkg/lib", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/lib/index.js"),
    });
  });

  it('with "lib-alias"', () => {
    expect(resolve("mixed-pkg/lib-alias", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/lib/index.js"),
    });

    expect(resolverV3.resolve("mixed-pkg/lib-alias", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/lib/index.js"),
    });
  });

  it('with "export.js"', () => {
    expect(resolve("mixed-pkg/export.js", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/index.js"),
    });

    expect(resolverV3.resolve("mixed-pkg/export.js", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/mixed-pkg/index.js"),
    });
  });
});
