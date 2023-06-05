import "@babel/register";
import fs from "fs";
import Module from "module";
import path from "path";
import tsNode from "ts-node";

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

tsNode.register({
    esm: true,

    // project: "./test/tsconfig.json",
    // compilerOptions: {
    //     // "target": "es6",
    //     "module": "ESNext",
    //     "moduleResolution": "nodenext",
    //     "allowSyntheticDefaultImports": true,
    //   }

    // disregard typescript errors before transpilation
    transpileOnly:true,

    //override package.json *type: module* setting
    moduleTypes: {
      "./test/**/*.ts": "cjs",
      "./lambda/**/*.ts": "cjs",
    }
})


// ERR_MODULE_NOT_FOUND
// NODE_DEBUG='module'
// DEBUG='*'


// const projectRoot = path.resolve();

const orig = Module._extensions[".js"];
Module._extensions[".js"] = function (module, filename) {

  try {
    return orig(module, filename);
  } catch (e) {
    // console.log(e.code+" "+path.relative(projectRoot,filename))
    // console.log(e.message)
    // From: https://github.com/nodejs/node/blob/c24b74a7abec0848484671771d250cfd961f128e/lib/internal/modules/cjs/loader.js#L1237-L1238
    if (e.code === "ERR_REQUIRE_ESM") {
      // because package.json type: "module"
      // and imports don't have extensions
      // create module being searched with contents
      const content = fs.readFileSync(filename, "utf8");
      module._compile(content, filename.split("/").pop());
      return;
    }

    throw e;
  }
};
