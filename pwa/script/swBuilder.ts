import fs from "fs";
import glob from "glob";
import md5 from "md5";
import path from "path";
import prettier from "prettier";
import { authenticationHeader } from "../../environment.development.js";
import {
  appUIEndpoint,
  firebaseConfig,
  pronounceEndoint,
} from "../../environment.production.js";
import {
  SERVICE_WORKER_LOGGER_MSG,
  SERVICE_WORKER_NEW_TERMS_ADDED,
} from "../../src/constants/actionNames.js";
import { getParam, removeParam } from "../../src/helper/urlHelper.js";
import { green } from "./consoleColor.js";
import { initServiceWorker } from "../src/sw.js"; // TODO: why? sw.ts?

/**
 * After app is built
 * takes a list of build file names and
 * creates a list to files to be cached
 */
const projectRoot = path.resolve();
const swTemplate = projectRoot + "/pwa/src/sw.js";
const outputDir = projectRoot + "/dist";
const swOutFile = outputDir + "/" + path.basename(swTemplate);

const filesToCache = glob
  .sync(`${outputDir}/*.{html,js,css,jpeg,png,ico,webmanifest}`, {
    nodir: true,
  })
  .reduce<string[]>((acc, p) => {
    const fileName = p.split("/").pop() || p;
    return fileName !== "sw.js" ? [...acc, fileName] : acc;
  }, []);

const stream = fs.createWriteStream(swOutFile, {
  flags: "w",
});

stream.on("finish", () => prettifyOutput(swOutFile));

const swVersion = md5(initServiceWorker.toString()).slice(0, 8);
const main =
  filesToCache.find((f) => f.match(new RegExp(/main.([a-z0-9]+).js/))) ||
  "main.00000000.js";
const [, jsVersion] = main.split(".");
const initCacheVer = md5(filesToCache.toString()).slice(0, 8);

console.log(
  green(
    JSON.stringify({
      swVersion: swVersion,
      jsVersion,
      bundleVersion: initCacheVer,
    })
  )
);

const buildConstants = {
  swVersion,
  initCacheVer,
  SERVICE_WORKER_LOGGER_MSG,
  SERVICE_WORKER_NEW_TERMS_ADDED,
  authenticationHeader,
  ghURL: appUIEndpoint,
  fbURL: firebaseConfig.databaseURL,
  gCloudFnPronounce: pronounceEndoint,
};

stream.write(
  "const buildConstants = " + JSON.stringify(buildConstants) + "\n\n"
);
stream.write(getParam + "\n\n");
stream.write(removeParam + "\n\n");
stream.write(initServiceWorker + "\n\n");

stream.write("const cacheFiles = " + JSON.stringify(filesToCache) + "\n\n");
stream.end(
  "initServiceWorker({...buildConstants, getParam, removeParam, cacheFiles});"
);

// TODO: prettifyOutput reopens file
function prettifyOutput(path: string) {
  const swPartialCodeBuff = fs.readFileSync(path);
  const prettyP = prettier.format(swPartialCodeBuff.toString(), {
    filepath: path,
  });

  const stream = fs.createWriteStream(path, {
    flags: "w",
  });

  prettyP.then(code=>{
    stream.write(code);
    stream.end();
  });
}
