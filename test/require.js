const fs = require("fs");

require("@babel/register");

const packageJsonName =
  "/media/bryan/work/Node/jobs/nmemonica/lambda/sheets/package.json";
const packageJsonRename =
  "/media/bryan/work/Node/jobs/nmemonica/lambda/sheets/package.json.no";

let rename = 0;

const waitToRevertRename = (last) => {
  setTimeout(() => {
    if (rename === last) {
      fs.rename(packageJsonRename, packageJsonName, () => {});
    }
  }, 5000);
};

fs.rename(packageJsonName, packageJsonRename, () => {});

const Module = require("module");
const orig = Module._extensions[".js"];
Module._extensions[".js"] = function (module, filename) {
  rename++;

  waitToRevertRename(rename);

  try {
    return orig(module, filename);
  } catch (e) {
    // if (e.code === 'ERR_REQUIRE_ESM')
    // console.log("error");
    // console.log(e);
    // console.log(filename);
    if (filename.includes("nmemonica/lambda/sheets")) {
      // From: https://github.com/nodejs/node/blob/c24b74a7abec0848484671771d250cfd961f128e/lib/internal/modules/cjs/loader.js#L1237-L1238
      const content = fs.readFileSync(filename, "utf8");

      module._compile(content, filename);
      return;
    }
    throw e
  }
};
