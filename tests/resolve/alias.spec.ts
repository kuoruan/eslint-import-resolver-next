import { getSingleRepoPath } from "@tests/utils";

import resolve from "@/resolve";

describe("Test alias", () => {
  const sourceFile = getSingleRepoPath("source.js");
  const sourceFile2 = getSingleRepoPath("b/source.js");
  const roots = [getSingleRepoPath()];

  it("should resolve alias", () => {
    const result = resolve("@/a", sourceFile, { roots, alias: { "@": "./src" } });
    const result2 = resolve("@/a", sourceFile2, { roots, alias: { "@": "./src" } });

    expect(result).deep.equal({
      found: true,
      path: getSingleRepoPath("src/a/index.js")
    })
    expect(result2).deep.equal({
      found: true,
      path: getSingleRepoPath("src/a/index.js")
    })
  });
});
