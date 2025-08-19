import { getMonoRepoPath } from "@tests/utils.js";

import { createNextImportResolver, resolve } from "@/resolve.js";

describe("Test monorepo", () => {
  const roots = [getMonoRepoPath()];

  it("base monorepo", () => {
    expect(
      resolve("@lib/foo", getMonoRepoPath("main/index.js"), {
        roots,
        alias: { "@lib": "./lib" },
        packages: ["main"],
      }),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("main/lib/foo.js"),
    });

    const resolverV3 = createNextImportResolver({
      roots,
      alias: { "@lib": "./lib" },
      packages: ["main"],
    });

    expect(
      resolverV3.resolve("@lib/foo", getMonoRepoPath("main/index.js")),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("main/lib/foo.js"),
    });
  });

  it("pnpm monorepo", () => {
    expect(
      resolve("@lib/foo", getMonoRepoPath("main/index.js"), {
        roots,
        alias: { "@lib": "./lib" },
        packages: {
          pnpmWorkspace: true,
        },
      }),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("main/lib/foo.js"),
    });

    const resolverV3 = createNextImportResolver({
      roots,
      alias: { "@lib": "./lib" },
      packages: {
        pnpmWorkspace: true,
      },
    });

    expect(
      resolverV3.resolve("@lib/foo", getMonoRepoPath("main/index.js")),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("main/lib/foo.js"),
    });
  });

  it("tsconfig", () => {
    expect(
      resolve("@/a", getMonoRepoPath("packages/ts/index.ts"), {
        roots,
      }),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("packages/ts/src/a.ts"),
    });

    expect(
      resolve("@src/a", getMonoRepoPath("packages/ts/tests/a.spec.ts"), {
        roots,
      }),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("packages/ts/src/a.ts"),
    });

    expect(
      resolve("#/root", getMonoRepoPath("packages/ts/tests/foo/b.spec.ts"), {
        roots,
      }),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("packages/ts/root.ts"),
    });

    const resolverV3 = createNextImportResolver({
      roots,
    });

    expect(
      resolverV3.resolve("@/a", getMonoRepoPath("packages/ts/index.ts")),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("packages/ts/src/a.ts"),
    });

    expect(
      resolverV3.resolve(
        "@src/a",
        getMonoRepoPath("packages/ts/tests/a.spec.ts"),
      ),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("packages/ts/src/a.ts"),
    });

    expect(
      resolverV3.resolve(
        "#/root",
        getMonoRepoPath("packages/ts/tests/foo/b.spec.ts"),
      ),
    ).deep.equal({
      found: true,
      path: getMonoRepoPath("packages/ts/root.ts"),
    });
  });
});
