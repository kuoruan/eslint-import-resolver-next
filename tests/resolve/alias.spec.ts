import { getSingleRepoPath } from "@tests/utils";

import { createNextImportResolver, resolve } from "@/resolve";

describe("Test alias", () => {
  const sourceFile = getSingleRepoPath("source.js");
  const sourceFile2 = getSingleRepoPath("b/source.js");
  const roots = [getSingleRepoPath()];

  const resolverV3 = createNextImportResolver({
    roots,
    alias: { "@": ["./src"] },
  });

  it("should resolve alias", () => {
    expect(
      resolve("@/a", sourceFile, {
        roots,
        alias: { "@": ["./src"] },
      }),
    ).deep.equal({
      found: true,
      path: getSingleRepoPath("src/a/index.js"),
    });
    expect(
      resolve("@/a", sourceFile2, {
        roots,
        alias: { "@": ["./src"] },
      }),
    ).deep.equal({
      found: true,
      path: getSingleRepoPath("src/a/index.js"),
    });

    expect(resolverV3.resolve("@/a", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("src/a/index.js"),
    });
    expect(resolverV3.resolve("@/a", sourceFile2)).deep.equal({
      found: true,
      path: getSingleRepoPath("src/a/index.js"),
    });
  });
});
