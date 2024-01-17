import eslintJsPlugin from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHookPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
// importPlugin uses 'eslint-import-resolver-typescript'
import fs from "fs";
import globals from "globals";
import prettier from "prettier";

// import jsdoc from "eslint-plugin-jsdoc";

// eslint flat config info
// https://eslint.org/blog/2022/08/new-config-system-part-2/

export default [
  {
    ignores: [".*", "node_modules/", "dist/"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,

      parserOptions: {
        project: "./src/tsconfig.json",
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
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHookPlugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },

      "import/resolver": {
        typescript: {
          project: "./src/tsconfig.json",
        },
      },
    },
    rules: {
      // ...tsPlugin.configs.all.rules,
      ...tsPlugin.configs.strict.rules,
      ...tsPlugin.configs["recommended"].rules,
      ...tsPlugin.configs["eslint-recommended"].rules,
      ...tsPlugin.configs["recommended-requiring-type-checking"].rules,

      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,

      ...reactHookPlugin.configs.recommended.rules,

      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,

      "no-console": "warn",

      // disable unsafe autofixing '?' optional chaining
      "@typescript-eslint/no-unnecessary-condition": "off",

      "@typescript-eslint/no-floating-promises": "warn",
      "react/no-array-index-key": "warn",
      "react/button-has-type": "warn",

      // https://medium.com/weekly-webtips/how-to-sort-imports-like-a-pro-in-typescript-4ee8afd7258a
      // https://github.com/import-js/eslint-plugin-import
      "sort-imports": [
        "error",
        {
          ignoreCase: false,
          ignoreDeclarationSort: true, // don"t want to sort import lines, use eslint-plugin-import instead
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
          allowSeparatedGroups: true,
        },
      ],

      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Built-in imports (come from NodeJS native) go first
            "external", // <- External imports
            "internal", // <- Absolute imports
            ["sibling", "parent"], // <- Relative imports, the sibling and parent types they can be mingled together
            "index", // <- index imports
            "unknown", // <- unknown
          ],
          "newlines-between": "always",
          alphabetize: {
            /* sort in ascending order. Options: ["ignore", "asc", "desc"] */
            order: "asc",
            /* ignore case. Options: [true, false] */
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    files: ["pwa/**/*.{js,ts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./pwa/tsconfig.json",
      },

      globals: { ...globals.browser /** only sw.js needs this */ },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...eslintJsPlugin.configs.recommended.rules,

      ...tsPlugin.configs.strict.rules,
      ...tsPlugin.configs["eslint-recommended"].rules,
      ...tsPlugin.configs["recommended-requiring-type-checking"].rules,
    },
  },
  {
    files: ["test/**/*.{js,ts}"],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.mocha },
    },
  },

  {
    // basic eslint for anything .js
    files: ["**/*.{js}"],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser },
    },
    rules: eslintJsPlugin.configs.recommended.rules,
  },
  {
    // everything gets prettier
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierPlugin.configs.recommended.rules,
      "prettier/prettier": ["error"],

      // "jsdoc/require-description": "error",
      // "jsdoc/check-values": "error"
    },
  },
  {
    // json gets prettier
    files: ["**/*.{json,css}"],

    languageOptions: {
      parser: {
        parse: (text, info) => {
          // When file is Json send it to prettier for formatting

          // const [text, info] = arg
          // console.log(JSON.stringify(info))

          const pretty = prettier.format(text, { filepath: info.filePath });

          const stream = fs.createWriteStream(info.filePath, {
            flags: "w",
          });

          stream.write(pretty);
          stream.end();

          throw new Error(
            "Sent to Prettier -> *." + info.filePath.split(".")[1]
          );
          // node_modules/eslint/lib/source-code/source-code.jsL326
          // return {'type':"Program", "body":[],'tokens':[], "comments":[], "loc":[], "range":{}, "scopes":[]}
        },
      },
    },
  },
];
