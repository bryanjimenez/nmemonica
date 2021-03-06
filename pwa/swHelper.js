import fs from "fs";
import glob from "glob-all";
import path from "path";
import {
  pronounceEndoint,
  appUIEndpoint,
  firebaseConfig,
} from "../environment.development";
import md5 from "../lambda/sheets/node_modules/md5/md5.js";

const projectRoot = path.resolve();
const swPartialCode = projectRoot + "/pwa/sw.js";
const swOutput = projectRoot + "/dist/sw.js";

const arrFilesToCache = glob.sync(
  [`${projectRoot}/dist/*.{html,js,css,jpeg,png,ico,webmanifest}`],
  { nodir: true }
);

const strFilesToCache = JSON.stringify(
  arrFilesToCache.reduce((acc, p) => {
    const fileName = p.split("/").pop();
    return fileName !== "sw.js" ? [...acc, fileName] : acc;
  }, [])
);

fs.open(swPartialCode, "r", (err, fd_sw) => {
  if (err) {
    throw err;
  }

  fs.readFile(fd_sw, {}, (err, buff) => {
    if (err) {
      console.log("read failed");
      throw err;
    }

    var stream = fs.createWriteStream(swOutput, {
      flags: "w",
    });

    stream.write("const cacheFilesConst = " + strFilesToCache + ";\n\n");
    stream.write("const swVersionConst =  '" + md5(buff) + "';\n\n");

    stream.write("const ghURLConst =  '" + appUIEndpoint + "';\n");
    stream.write("const fbURLConst =  '" + firebaseConfig.databaseURL + "';\n");
    stream.write(
      "const gCloudFnPronounceConst =  '" + pronounceEndoint + "';\n\n"
    );

    stream.write(buff);

    stream.end();
  });
});
