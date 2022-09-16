import * as fs from "fs";
import * as glob from "glob-all";
import * as path from "path";
import {
  pronounceEndoint,
  appUIEndpoint,
  firebaseConfig,
} from "../../environment.development";
import {
  SERVICE_WORKER_LOGGER_MSG,
  SERVICE_WORKER_NEW_TERMS_ADDED,
// } from "../src/actions/serviceWorkerAct"; // FIXME: this pulls other unused code
} from "../shared/serviceWorkerAct";
import * as md5 from "md5";
import { getParam, removeParam } from "../../src/helper/urlHelper";

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

  fs.readFile(fd_sw, {}, (err, buff) => {
    if (err) {
      console.log("read failed");
      throw err;
    }

    var stream = fs.createWriteStream(swOutput, {
      flags: "w",
    });

    stream.write("const cacheFilesConst = " + strFilesToCache + ";\n\n");

    stream.write("const swVersionConst = '" + md5(buff).slice(0, 8) + "';\n");
    stream.write(
      "const initCacheVerConst = '" + md5(strFilesToCache).slice(0, 8) + "';\n\n"
    );

    stream.write("const ghURLConst = '" + appUIEndpoint + "';\n");
    stream.write("const fbURLConst = '" + firebaseConfig.databaseURL + "';\n");
    stream.write(
      "const gCloudFnPronounceConst = '" + pronounceEndoint + "';\n\n"
    );

    stream.write(
      "const swMsgTypeLoggerConst = '" + SERVICE_WORKER_LOGGER_MSG + "';\n\n"
    );
    stream.write(
      "const swMsgTypeNewTermsAddedConst = '" +
        SERVICE_WORKER_NEW_TERMS_ADDED +
        "';\n\n"
    );

    stream.write("const getParamConst = " + getParam + ";\n\n");
    stream.write("const removeParamConst = " + removeParam + ";\n\n");

    stream.write(buff);

    stream.end();
  });
});
