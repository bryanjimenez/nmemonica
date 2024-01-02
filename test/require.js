import tsNode from "ts-node";
import path from "node:path";
import Module from "module";

/*
# ts-node
    commonjs vs esm

# ERR_REQUIRE_ESM
# ERR_UNKNOWN_FILE_EXTENSION
    https://typestrong.org/ts-node/docs/troubleshooting
    https://typestrong.org/ts-node/docs/imports/#native-ecmascript-modules
    https://typestrong.org/ts-node/docs/module-type-overrides/


# Mocha
    config file
    https://typestrong.org/ts-node/docs/recipes/mocha/
*/

// ERR_MODULE_NOT_FOUND
// NODE_DEBUG='module'
// DEBUG='*'

tsNode.register({
  esm: true,

  project: "./src/tsconfig.json",

  // disregard typescript errors before transpilation
  transpileOnly: true,

  compilerOptions:{
    // error TS5095: Option 'bundler' can only be used when 'module' is set to 'es2015' or later.
    moduleResolution: 'node'
  },

  //override package.json *type: module* setting
  moduleTypes: {
    "./environment.*.ts": "cjs",
    "./test/**/*.ts": "cjs",
    "./test/**/*.tsx": "cjs",
    "./src/**/*.ts": "cjs",
    "./src/**/*.tsx": "cjs",
    "./pwa/**/*.ts":"cjs",
  },
});

const projectRoot = path.resolve();

const orig = Module._extensions[".js"];
Module._extensions[".js"] = function (module, filename) {
  try {
    if (filename.endsWith(".css")) {
      /**
       * From: https://github.com/TypeStrong/ts-node/issues/175
       * /media/bryan/work/Node/jobs/nmemonica/src/css/StackNavButton.css:1
       * .main-panel .MuiButton {
       * ^
       * SyntaxError: Unexpected token '.'
       *
       * We are going to ignore css files
       */
      return;
    }

    return orig(module, filename);
  } catch (e) {
    console.log(e.code + " " + path.relative(projectRoot, filename));
    // console.log(e.message)
    // From: https://github.com/nodejs/node/blob/c24b74a7abec0848484671771d250cfd961f128e/lib/internal/modules/cjs/loader.js#L1237-L1238
    // if (e.code === "ERR_REQUIRE_ESM") {
    //   // because package.json type: "module"
    //   // and imports don't have extensions
    //   // create module being searched with contents
    //   const content = fs.readFileSync(filename, "utf8");
    //   module._compile(content, filename.split("/").pop());
    //   return;
    // }

    throw e;
  }
};
