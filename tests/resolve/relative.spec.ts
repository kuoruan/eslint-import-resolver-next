import { getSingleRepoPath } from "@tests/utils";

import resolve from "@/resolve";

describe("resolve alias", () => {
  const root = getSingleRepoPath();
  const sourceFile = getSingleRepoPath("source.js");

  it("should resolve relative", () => {
    const result = resolve("./src/foo", sourceFile, { roots: [root] });

    const result2 = resolve("../a", getSingleRepoPath("src/b/foo.js"), {
      roots: [root],
    });

    expect(result).deep.equal({
      path: getSingleRepoPath("src/foo.js"),
      found: true,
    });
    expect(result2).deep.equal({
      path: getSingleRepoPath("src/a/index.js"),
      found: true,
    });
  });

  it("should resolve module with the same filename", () => {
    const result = resolve(
      "module-pkg",
      getSingleRepoPath("src/module-pkg.js"),
      {
        roots: [root],
      },
    );
    const result2 = resolve(
      "commonjs-pkg",
      getSingleRepoPath("src/commonjs-pkg/index.js"),
      {
        roots: [root],
      },
    );

    expect(result).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/index.js"),
    });
    expect(result2).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });
  });
});
