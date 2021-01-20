const fs = require("fs");
const glob = require("glob-all");
const path = require("path");

const projectRoot = path.dirname(__dirname);
const swPartialCode = projectRoot + "/pwa/sw.js";
const swOutput = projectRoot + "/dist/sw.js";

const arrFilesToCache = glob.sync(
  [`${path.dirname(__dirname)}/dist/*.{html,js,css,jpeg,png,ico,webmanifest}`],
  { nodir: true }
);

const strFilesToCache = JSON.stringify(
  arrFilesToCache.map((p) => p.split("/").pop())
);

const str = "const cacheFiles = " + strFilesToCache;

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
      flags: "a",
    });

    stream.write(str + "\n\n");
    stream.write(buff);

    stream.end();
  });
});
