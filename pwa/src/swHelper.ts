import * as fs from "fs";
import * as glob from "glob-all";
import * as path from "path";
import {
  pronounceEndoint,
  appUIEndpoint,
  firebaseConfig,
} from "../../environment.production";  // typesscript does not do module replace
import {
  SERVICE_WORKER_LOGGER_MSG,
  SERVICE_WORKER_NEW_TERMS_ADDED,
  // } from "../src/actions/serviceWorkerAct"; // FIXME: this pulls other unused code
} from "../shared/serviceWorkerAct";
import * as md5 from "md5";
import { green } from "./consoleColor";
import { getParam, removeParam } from "../../src/helper/urlHelper";
import { authenticationHeader } from "../../environment.development";

const projectRoot = path.resolve();
const swPartialCode = projectRoot + "/pwa/sw.js";
const swOutput = projectRoot + "/dist/sw.js";

const arrFilesToCache = glob.sync(
  [`${projectRoot}/dist/*.{html,js,css,jpeg,png,ico,webmanifest}`],
  { nodir: true }
);

const strFilesToCache = JSON.stringify(
  arrFilesToCache?.reduce((acc, p) => {
    const fileName = p.split("/").pop();
    return fileName !== "sw.js" ? [...acc, fileName] : acc;
  }, [])
);

fs.open(swPartialCode, "r", (err, fd_sw) => {
  if (err) {
    throw err;
  }

  fs.readFile(fd_sw, {}, (err, swPartialCodeBuff) => {
    if (err) {
      console.log("read failed");
      throw err;
    }

    var stream = fs.createWriteStream(swOutput, {
      flags: "w",
    });

    const swVersion = md5(swPartialCodeBuff).slice(0, 8);
    const jsVersion = JSON.parse(strFilesToCache)
      .join(",")
      .match(new RegExp(/main.([a-z0-9]+).js/))[1];
    const initCacheVer = md5(strFilesToCache).slice(0, 8);

    stream.write("const cacheFiles = " + strFilesToCache + ";\n\n");

    stream.write("const swVersion = '" + swVersion + "';\n");
    stream.write("const initCacheVer = '" + initCacheVer + "';\n\n");

    console.log(
      green(
        JSON.stringify({
          swVersion: swVersion,
          jsVersion,
          bundleVersion: initCacheVer,
        })
      )
    );

    stream.write("const ghURL = '" + appUIEndpoint + "';\n");
    stream.write("const fbURL = '" + firebaseConfig.databaseURL + "';\n");
    stream.write(
      "const gCloudFnPronounce = '" + pronounceEndoint + "';\n\n"
    );

    stream.write(
      "const SERVICE_WORKER_LOGGER_MSG = '" + SERVICE_WORKER_LOGGER_MSG + "';\n"
    );
    stream.write(
      "const SERVICE_WORKER_NEW_TERMS_ADDED = '" +
        SERVICE_WORKER_NEW_TERMS_ADDED +
        "';\n\n"
    );

    stream.write("const getParam = " + getParam + ";\n\n");
    stream.write("const removeParam = " + removeParam + ";\n\n");
    stream.write("const authenticationHeader = '" + authenticationHeader + "';\n\n");

    stream.write(swPartialCodeBuff);

    stream.end();
  });
});
