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
});
