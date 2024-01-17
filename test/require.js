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

// ERR_MODULE_NOT_FOUND
// NODE_DEBUG='module'
// DEBUG='*'

tsNode.register({
  esm: true,

  project: "./src/tsconfig.json",

  // disregard typescript errors before transpilation
  transpileOnly: true,

  //override package.json *type: module* setting
  moduleTypes: {
    "./test/**/*.ts": "cjs",
    "./test/**/*.tsx": "cjs",
    "./src/**/*.ts": "cjs",
    "./src/**/*.tsx": "cjs",
    "./lambda/**/*.ts": "cjs",
  },
});

// const projectRoot = path.resolve();

// const orig = Module._extensions[".js"];
// Module._extensions[".js"] = function (module, filename) {

//   try {
//     return orig(module, filename);
//   } catch (e) {
//     // console.log(e.code+" "+path.relative(projectRoot,filename))
//     // console.log(e.message)
//     // From: https://github.com/nodejs/node/blob/c24b74a7abec0848484671771d250cfd961f128e/lib/internal/modules/cjs/loader.js#L1237-L1238
//     if (e.code === "ERR_REQUIRE_ESM") {
//       // because package.json type: "module"
//       // and imports don't have extensions
//       // create module being searched with contents
//       const content = fs.readFileSync(filename, "utf8");
//       module._compile(content, filename.split("/").pop());
//       return;
//     }

//     throw e;
//   }
// };
