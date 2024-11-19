const path = require("path");
const { expect } = require("chai");
const { resolve } = require("../index");

const nodeModules = path.join(__dirname, "fixtures", "node_modules");

const sourceFile = path.join(__dirname, "fixtures", "source.js");

describe("test buildins", () => {
  it("only module name", () => {
    expect(resolve("fs", sourceFile)).deep.equal({
      found: true,
      path: null,
    });
  });

  it("with node: prefix", () => {
    expect(resolve("node:fs", sourceFile)).deep.equal({
      found: true,
      path: null,
    });
  });
});

describe("test commonjs package", () => {
  it("with default", () => {
    expect(resolve("commonjs-pkg", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "index.js"', () => {
    expect(resolve("commonjs-pkg/index.js", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "index"', () => {
    expect(resolve("commonjs-pkg/index", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "lib"', () => {
    expect(resolve("commonjs-pkg/lib", sourceFile)).deep.equal({
      found: false,
    });
  });
});

describe("test module package", () => {
  it("with default", () => {
    expect(resolve("module-pkg", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "module-pkg", "index.js"),
    });
  });

  it('with "index.js"', () => {
    expect(resolve("module-pkg/index.js", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "module-pkg", "index.js"),
    });
  });

  it('with "index"', () => {
    expect(resolve("module-pkg/index", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "lib"', () => {
    expect(resolve("module-pkg/lib", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "module-pkg/lib/index.js"),
    });
  });

  it('with "lib-alias"', () => {
    expect(resolve("module-pkg/lib-alias", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "module-pkg/lib/index.js"),
    });
  });
});

describe("Test alias package", () => {
  it("base alias", () => {
    expect(resolve("alias-pkg", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "alias-pkg/index.mjs"),
    });
  });
});

describe("test mixed package", () => {
  it("with default", () => {
    expect(resolve("mixed-pkg", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "mixed-pkg/index.mjs"),
    });
  });

  it('with "index.js"', () => {
    expect(resolve("mixed-pkg/index.js", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "index"', () => {
    expect(resolve("mixed-pkg/index", sourceFile)).deep.equal({
      found: false,
    });
  });

  it('with "lib"', () => {
    expect(resolve("mixed-pkg/lib", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "mixed-pkg/lib/index.mjs"),
    });
  });

  it('with "lib-alias"', () => {
    expect(resolve("mixed-pkg/lib-alias", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "mixed-pkg/lib/index.mjs"),
    });
  });

  it('with "export.js"', () => {
    expect(resolve("mixed-pkg/export.js", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "mixed-pkg/index.mjs"),
    });
  });
});
