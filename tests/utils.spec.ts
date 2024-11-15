import { normalizePatterns } from "@/utils";

describe("test normalize patterns", () => {
  it("normalize patterns", () => {
    const result1 = normalizePatterns(["/path/to/pattern"]);
    const result2 = normalizePatterns(["/", "/path/to/"]);

    expect(result1).toEqual([
      "/path/to/pattern/package.json",
      "/path/to/pattern/package.json5",
      "/path/to/pattern/package.yaml",
    ]);
    expect(result2).toEqual([
      "/package.json",
      "/package.json5",
      "/package.yaml",
      "/path/to/package.json",
      "/path/to/package.json5",
      "/path/to/package.yaml",
    ]);
  });
});
