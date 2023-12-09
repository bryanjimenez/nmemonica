import express from "express";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { getData } from "./data.js";
import { getWorkbookXS, putWorkbookXSAsync } from "./workbook.js";
import { getAudioAsync } from "./audio.js";
import "dotenv/config";
import { isSelfSignedCA, lan } from "../environment-host.cjs";
import { uiHost as productionOrigin } from "../environment.production.js";
import { requestUserPermission } from "./helper/userPermission.js";
import { getPublicKey, pushSheetDataAsync, registerClient } from "./push.js";
import { checkAllOrigin, custom404, customError } from "./helper/utils.js";
import { getCA } from "./appUi.js";

const uiPort = process.env.UI_PORT;
const httpPort = Number(process.env.SERVICE_PORT);
export const httpsPort = Number(process.env.SERVICE_HTTPS_PORT);
const audioPath = process.env.AUDIO_PATH;
export const dataPath = process.env.DATA_PATH;
const sheetPath = process.env.SHEET_PATH;

const pathPushGetPubKey = process.env.PATH_PUSH_GET_PUB_KEY;
const pathPushRegister = process.env.PATH_PUSH_REGISTER;
const pushSheetData = process.env.PATH_PUSH_SHEET_DATA;

const projectRoot = path.resolve();
export const CSV_DIR = path.normalize(`${projectRoot}/data/csv`);
export const JSON_DIR = path.normalize(`${projectRoot}/data/json`);
export const subscriptionFile = path.normalize(
  `${JSON_DIR}/subscriptions.json`
);

if (
  !(
    uiPort &&
    httpsPort &&
    audioPath &&
    dataPath &&
    sheetPath &&
    pathPushGetPubKey &&
    pathPushRegister &&
    pushSheetData
  )
) {
  throw new Error("dotenv missing");
}

if (!lan.address) {
  throw new Error("Could not get host IP");
}

const localhost = lan.address; // or "localhost"
export const serviceIP = lan.address; // or lan.hostname

await requestUserPermission(
  isSelfSignedCA,
  serviceIP,
  localhost,
  JSON_DIR,
  CSV_DIR,
  httpPort,
  httpsPort
);

export const allowedOrigins = [
  `https://localhost:${uiPort}`,
  `https://127.0.0.1:${uiPort}`,
  `https://${serviceIP}:${uiPort}`,
  `https://${lan.hostname}.local:${uiPort}`,
  productionOrigin,
];

const app = express();

app.disable("x-powered-by");
app.use(express.json()); // for parsing application/json
// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// check origin from all requests
app.use(checkAllOrigin(isSelfSignedCA));

// app.get("/", getUi)
// app.get("/:resource.:ext", getAsset)
app.get("/getCA", getCA);

app.get(audioPath, getAudioAsync);

// JSON
app.get(dataPath + "/:data.json", getData);

// SHEETS
app.get(sheetPath, getWorkbookXS);
app.put(sheetPath, putWorkbookXSAsync);

// PUSH
app.get(pathPushGetPubKey, getPublicKey);
app.post(pathPushRegister, registerClient);
app.post(pushSheetData, pushSheetDataAsync);

app.use(custom404);
app.use(customError);

const httpSever = http.createServer(app);
httpSever.listen(httpPort, localhost, 0, () => {
  console.log("\n");
  console.log("workbook http service");
  console.log("http://" + localhost + ":" + httpPort + "\n\n");
});

if (isSelfSignedCA) {
  const privateKey = fs.readFileSync(
    projectRoot + "/" + process.env.PATH_KEY,
    "utf8"
  );
  const certificate = fs.readFileSync(
    projectRoot + "/" + process.env.PATH_CRT,
    "utf8"
  );

  const credentials = {
    key: privateKey,
    cert: certificate,
  };

  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(httpsPort, serviceIP, 0, () => {
    console.log("\n");
    console.log("workbook https service");
    console.log("https://" + serviceIP + ":" + httpsPort + "\n\n");
  });
}
