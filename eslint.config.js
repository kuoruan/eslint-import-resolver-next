import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["lib", "node_modules"],
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },
  {
    files: ["**/*.{js,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
