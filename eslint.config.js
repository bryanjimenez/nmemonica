import globals from "globals";
// import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintJsPlugin from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import prettierPlugin from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHookPlugin from "eslint-plugin-react-hooks";
// import jsdoc from "eslint-plugin-jsdoc";

// eslint flat config info
// https://eslint.org/blog/2022/08/new-config-system-part-2/

export default [
  {
    ignores: [".*", "node_modules/", "dist/"],
  },
  {
    rules: eslintJsPlugin.configs.recommended.rules,
  },
  {
    plugins: {
      // "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      //...tsPlugin.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,

      semi: ["error", "always"],
      "space-infix-ops": ["error", { int32Hint: false }], // require spacing around infix operators
      "prettier/prettier": ["error"],

      // "jsdoc/require-description": "error",
      // "jsdoc/check-values": "error"
    },
  },
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    languageOptions: {
      // parser: tsParser,
      parser: babelParser,
      parserOptions: {
        // project: "./tsconfig.json", // for tsParser
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: "module",
      globals: { ...globals.browser },
    },
    plugins: {
      // "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHookPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHookPlugin.configs.recommended.rules,
      "no-console": "warn",
      "react/react-in-jsx-scope": 0, // will be obsolete soon?
      "react/jsx-uses-react": 0, // TODO: remove React from imports
    },
  },
  {
    files: ["pwa/**/*.js", "pwa/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser },
    },
  },
  {
    files: ["test/**/*.js", "test/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.mocha },
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      // parser: tsParser,
      parser: babelParser,
      parserOptions: {
        // project: "./tsconfig.json", // for tsParser
        sourceType: "module",
        ecmaVersion: "latest",
      },
      sourceType: "module",
      globals: { ...globals.nodeBuiltin },
    },
    plugins: {
      // "@typescript-eslint": tsPlugin,
      // prettier: prettierPlugin,
    },
    rules: {
      // "jsdoc/require-description": "error",
      // "jsdoc/check-values": "error"
    },
  },
];
