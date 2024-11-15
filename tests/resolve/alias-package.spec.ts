import { getSingleRepoPath } from "@tests/utils";

import resolve from "@/resolve";

describe("Test alias package", () => {
  const sourceFile = getSingleRepoPath("source.js");
  const roots = [getSingleRepoPath()];

  it("base alias", () => {
    expect(resolve("alias-pkg", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/alias-pkg/index.mjs"),
    });
  });
});
