import { getSingleRepoPath } from "@tests/utils";

import { createNextImportResolver, resolve } from "@/resolve";

describe("test commonjs package", () => {
  const sourceFile = getSingleRepoPath("source.js");

  const roots = [getSingleRepoPath()];

  const resolverV3 = createNextImportResolver({ roots });

  it("with default", () => {
    expect(resolve("commonjs-pkg", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });

    expect(resolverV3.resolve("commonjs-pkg", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });
  });

  it('with "index.js"', () => {
    expect(resolve("commonjs-pkg/index.js", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });

    expect(resolverV3.resolve("commonjs-pkg/index.js", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });
  });

  it('with "index"', () => {
    expect(resolve("commonjs-pkg/index", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });

    expect(resolverV3.resolve("commonjs-pkg/index", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });
  });

  it('with "lib"', () => {
    expect(resolve("commonjs-pkg/lib", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/lib/index.js"),
    });

    expect(resolverV3.resolve("commonjs-pkg/lib", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/lib/index.js"),
    });
  });
});
