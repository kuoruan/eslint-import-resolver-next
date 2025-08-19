import { getSingleRepoPath } from "@tests/utils.js";

import { createNextImportResolver, resolve } from "@/resolve.js";

describe("test module package", () => {
  const sourceFile = getSingleRepoPath("source.js");
  const roots = [getSingleRepoPath()];

  const resolverV3 = createNextImportResolver({ roots });

  it("with default", () => {
    expect(resolve("module-pkg", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/index.js"),
    });

    expect(resolverV3.resolve("module-pkg", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/index.js"),
    });
  });

  it('with "index.js"', () => {
    expect(resolve("module-pkg/index.js", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/index.js"),
    });

    expect(resolverV3.resolve("module-pkg/index.js", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/index.js"),
    });
  });

  it('with "index"', () => {
    expect(resolve("module-pkg/index", sourceFile, { roots })).deep.equal({
      found: false,
    });

    expect(resolverV3.resolve("module-pkg/index", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "lib"', () => {
    expect(resolve("module-pkg/lib", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/lib/index.js"),
    });

    expect(resolverV3.resolve("module-pkg/lib", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/lib/index.js"),
    });
  });

  it('with "lib-alias"', () => {
    expect(resolve("module-pkg/lib-alias", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/lib/index.js"),
    });

    expect(resolverV3.resolve("module-pkg/lib-alias", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/lib/index.js"),
    });
  });
});
