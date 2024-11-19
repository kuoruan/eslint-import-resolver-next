import { getMonoRepoPath } from "@tests/utils";

import resolve from "@/resolve";

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
  });
});
