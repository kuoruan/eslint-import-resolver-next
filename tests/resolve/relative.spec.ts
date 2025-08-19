import { getSingleRepoPath } from "@tests/utils.js";

import { createNextImportResolver, resolve } from "@/resolve.js";

describe("resolve alias", () => {
  const roots = [getSingleRepoPath()];
  const sourceFile = getSingleRepoPath("source.js");

  const resolverV3 = createNextImportResolver({ roots });

  it("should resolve relative", () => {
    expect(resolve("./src/foo", sourceFile, { roots })).deep.equal({
      found: true,
      path: getSingleRepoPath("src/foo.js"),
    });
    expect(
      resolve("../a", getSingleRepoPath("src/b/foo.js"), {
        roots,
      }),
    ).deep.equal({
      found: true,
      path: getSingleRepoPath("src/a/index.js"),
    });

    expect(resolverV3.resolve("./src/foo", sourceFile)).deep.equal({
      found: true,
      path: getSingleRepoPath("src/foo.js"),
    });
    expect(
      resolverV3.resolve("../a", getSingleRepoPath("src/b/foo.js")),
    ).deep.equal({
      found: true,
      path: getSingleRepoPath("src/a/index.js"),
    });
  });

  it("should resolve module with the same filename", () => {
    expect(
      resolve("module-pkg", getSingleRepoPath("src/module-pkg.js"), { roots }),
    ).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/index.js"),
    });
    expect(
      resolve("commonjs-pkg", getSingleRepoPath("src/commonjs-pkg/index.js"), {
        roots,
      }),
    ).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });

    expect(
      resolverV3.resolve("module-pkg", getSingleRepoPath("src/module-pkg.js")),
    ).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/module-pkg/index.js"),
    });
    expect(
      resolverV3.resolve(
        "commonjs-pkg",
        getSingleRepoPath("src/commonjs-pkg/index.js"),
      ),
    ).deep.equal({
      found: true,
      path: getSingleRepoPath("node_modules/commonjs-pkg/index.js"),
    });
  });
});
