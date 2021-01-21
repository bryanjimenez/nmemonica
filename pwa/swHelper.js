const fs = require("fs");
const glob = require("glob-all");
const path = require("path");

const filesToCache = glob.sync(
  [`${path.dirname(__dirname)}/dist/*.{html,js,css,jpeg,png,ico}`],
  { nodir: true }
);

const strFilesToCache = JSON.stringify(
  filesToCache.map((p) => p.split("/").pop())
);

const str = "const cacheFiles = " + strFilesToCache;

fs.open(`${path.dirname(__dirname)}/pwa/sw.js`, "r", (err, fd_sw) => {
  if (err) {
    throw err;
  }

  fs.readFile(fd_sw, {}, (err, buff) => {
    if (err) {
      console.log("errrrr");
      throw err;
    }

    var stream = fs.createWriteStream(`${path.dirname(__dirname)}/dist/sw.js`, {
      flags: "a",
    });

    stream.write(str + "\n\n");
    stream.write(buff);

    stream.end();
  });
});

// fs.writeFile(fd, str, (err) => {
//   if (err) {
//     throw err;
//   }
//   console.log("wrote > " + cache_list_filename);
// });
// });

/*
fs.open(
  `${path.dirname(__dirname)}/dist/${caches_filename}`,
  "wx",
  (err, fd) => {
    if (err) {
      if (err.code === "EEXIST") {
        console.error("myfile already exists");
        return;
      }

      throw err;
    }

    const str =
      'export const cacheFiles = require("./' +
      cache_list_filename +
      '").cacheFiles;';
    // const str = "export const cacheFiles = "+strFilesToCache;

    fs.writeFile(fd, str, (err) => {
      if (err) {
        throw err;
      }
      // console.log('wrote > '+cache_list_filename);
    });
  }
);
*/

// const cacheFiles = require('./cache_list.js').cacheFiles;

/*
var stream = fs.createWriteStream("append.txt", { flags: "a" });
// console.log(new Date().toISOString());
[...Array(10000)].forEach(function (item, index) {
  stream.write(index + "\n");
});
// console.log(new Date().toISOString());
stream.end();
*/
