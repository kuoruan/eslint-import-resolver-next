import { getSingleRepoPath } from "@tests/utils.js";

import { createNextImportResolver, resolve } from "@/resolve.js";

describe("Test alias package", () => {
  const sourceFile = getSingleRepoPath("source.js");
  const roots = [getSingleRepoPath()];

  const resolverV3 = createNextImportResolver({ roots });

  it("base alias", () => {
    expect(resolve("alias-pkg", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/alias-pkg/index.mjs"),
    });

    expect(resolverV3.resolve("alias-pkg", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/alias-pkg/index.mjs"),
    });
  });
});
