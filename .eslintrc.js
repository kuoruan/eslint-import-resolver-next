/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    mocha: true,
  },
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 6,
    requireConfigFile: false,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
};
