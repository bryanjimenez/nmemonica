import fs from "fs";
import glob from "glob";
import md5 from "md5";
import path from "path";
import prettier from "prettier";
import { getParam, removeParam } from "../../src/helper/urlHelper.js";
import {
  SWMsgIncoming,
  SWMsgOutgoing,
  SWRequestHeader,
} from "../../src/helper/serviceWorkerHelper.js";
import { green } from "./consoleColor.js";
import { initServiceWorker } from "../src/sw.js"; // TODO: why? sw.ts?
import { DebugLevel } from "../../src/slices/settingHelper.js";
import {
  dataServiceEndpoint,
  uiEndpoint,
  pronounceEndoint,
} from "../../environment.production.js";

import "dotenv/config";
import {
  IDBErrorCause,
  IDBKeys,
  IDBStores,
  addIDBItem,
  appDBName,
  appDBVersion,
  getIDBItem,
  openIDB,
  putIDBItem,
} from "../helper/idbHelper.js";

const audioPath = process.env.AUDIO_PATH;
const dataPath = process.env.DATA_PATH;

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

  urlAppUI: uiEndpoint,
  urlDataService: dataServiceEndpoint,
  urlPronounceService: pronounceEndoint,

  audioPath,
  dataPath,
};

export interface SwFnParams {
  swVersion: string;
  initCacheVer: string;
  cacheFiles: string[];

  urlAppUI: string;
  urlDataService: string;
  urlPronounceService: string;

  audioPath: string;
  dataPath: string;

  getParam: (baseUrl: string, param: string) => string;
  removeParam: (baseUrl: string, param: string) => string;
}

let out = "";
out += "const buildConstants = " + JSON.stringify(buildConstants) + "\n\n";
out += "const SWMsgOutgoing = " + JSON.stringify(SWMsgOutgoing) + "\n\n";
out += "const SWMsgIncoming = " + JSON.stringify(SWMsgIncoming) + "\n\n";
out += "const SWRequestHeader = " + JSON.stringify(SWRequestHeader) + "\n\n";
out += "const IDBStores = " + JSON.stringify(IDBStores) + "\n\n";
out += "const IDBKeys = " + JSON.stringify(IDBKeys) + "\n\n";
out += "const DebugLevel = " + JSON.stringify(DebugLevel) + "\n\n";

// IndexedDB imports
out += "const appDBName = '" + appDBName + "'\n\n";
out += "const appDBVersion = " + appDBVersion + "\n\n";
out += "const IDBErrorCause = " + JSON.stringify(IDBErrorCause) + "\n\n";
out += openIDB.toString() + "\n\n";
out += getIDBItem.toString() + "\n\n";
out += putIDBItem.toString() + "\n\n";
out += addIDBItem.toString() + "\n\n";

out += getParam.toString() + "\n\n";
out += removeParam.toString() + "\n\n";
out += initServiceWorker.toString() + "\n\n";
out += "const cacheFiles = " + JSON.stringify(filesToCache) + "\n\n";
out +=
  "initServiceWorker({...buildConstants, getParam, removeParam, cacheFiles});";

void prettier
  .format(out, {
    filepath: swOutFile,
  })
  .then((prettyCode) => {
    fs.writeFileSync(swOutFile, prettyCode, { encoding: "utf-8" });
  });
