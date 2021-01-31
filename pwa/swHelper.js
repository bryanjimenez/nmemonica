const fs = require("fs");
const glob = require("glob-all");
const path = require("path");
const md5 = require("../lambda/sheets/node_modules/md5");

const projectRoot = path.dirname(__dirname);
const swPartialCode = projectRoot + "/pwa/sw.js";
const swOutput = projectRoot + "/dist/sw.js";

const arrFilesToCache = glob.sync(
  [`${path.dirname(__dirname)}/dist/*.{html,js,css,jpeg,png,ico,webmanifest}`],
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

    stream.write("const cacheFiles = " + strFilesToCache + "\n\n");
    stream.write("// " + md5(buff) + "\n\n");
    stream.write(buff);

    stream.end();
  });
});
