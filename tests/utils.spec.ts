import { normalizePatterns, pathsToAlias } from "@/utils";

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

describe("test jsconfig paths to alias", () => {
  it("jsconfig paths to alias", () => {
    const result1 = pathsToAlias({
      "@/*": ["/path/to/*"],
    });
    const result2 = pathsToAlias({
      "@/*": ["/path/to/*", "/path/to2/*"],
    });
    const result3 = pathsToAlias({
      "@aaa/*": ["./path/to/*"],
    });

    expect(result1).toEqual({
      "@": ["/path/to"],
    });
    expect(result2).toEqual({
      "@": ["/path/to", "/path/to2"],
    });
    expect(result3).toEqual({
      "@aaa": ["path/to"],
    });
  });

  it("jsconfig paths with baseUrl", () => {
    const result1 = pathsToAlias(
      {
        "@/*": ["/path/to/*"],
      },
      "/path",
    );
    const result2 = pathsToAlias(
      {
        "@/*": ["/path/to/*", "/path/to2/*"],
      },
      "/path",
    );
    const result3 = pathsToAlias(
      {
        "@aaa/*": ["./path/to/*"],
      },
      "./",
    );

    expect(result1).toEqual({
      "@": ["/path/path/to"],
    });
    expect(result2).toEqual({
      "@": ["/path/path/to", "/path/path/to2"],
    });
    expect(result3).toEqual({
      "@aaa": ["path/to"],
    });
  });
});
