import express from "express";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { getData } from "./data.js";
import { getWorkbookXS, putWorkbookXS } from "./workbook.js";
import { getAudio } from "./audio.js";
import "dotenv/config";
import { isSelfSignedCA, host } from "../environment-host.cjs";
import { requestUserPermission } from "./helper/userPermission.js";

const uiPort = process.env.UI_PORT;
const httpPort = Number(process.env.SERVICE_PORT);
const httpsPort = Number(process.env.SERVICE_HTTPS_PORT);
const audioPath = process.env.AUDIO_PATH;
const dataPath = process.env.DATA_PATH;
const sheetPath = process.env.SHEET_PATH;


if (!(uiPort && httpsPort && audioPath && dataPath && sheetPath)) {
  throw new Error("dotenv missing");
}

const localhost = "localhost";
export const serviceIP = host;
if (serviceIP === undefined) {
  throw new Error("Could not get host IP");
}

const projectRoot = path.resolve();
export const CSV_DIR = path.normalize(`${projectRoot}/data/csv`);
export const JSON_DIR = path.normalize(`${projectRoot}/data/json`);

await requestUserPermission(
  isSelfSignedCA,
  serviceIP,
  localhost,
  JSON_DIR,
  CSV_DIR,
  httpPort,
  httpsPort,
);

export const allowedOrigins = [
  `https://localhost:${uiPort}`,
  `https://127.0.0.1:${uiPort}`,
  `https://${serviceIP}:${uiPort}`,
];

const app = express();
// app.use(express.json()) // for parsing application/json
// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// check origin from all requests
app.use((req, res, next) => {
  console.log(
    (req.secure ? "https" : "http") + " " + req.method + " " + req.url
  );

  if (!req.secure && !isSelfSignedCA) {
    res.set("Access-Control-Allow-Origin", req.headers.origin);
    res.set("Access-Control-Allow-Methods", "GET, PUT");
    res.set("Access-Control-Allow-Headers", "Content-Type, Data-Version");
  }

  if (req.secure) {
    if (req.method === "OPTIONS") {
      const allowed =
        req.headers.origin && allowedOrigins.includes(req.headers.origin)
          ? req.headers.origin
          : allowedOrigins[0];

      res.set("Access-Control-Allow-Origin", allowed);
      res.set("Vary", "Origin");
      res.set("Access-Control-Allow-Methods", "GET, PUT");
      res.set("Access-Control-Allow-Headers", "Content-Type, Data-Version");

      res.sendStatus(204);
      return;
    }

    if (!req.headers.origin || !allowedOrigins.includes(req.headers.origin)) {
      res.sendStatus(401);
      next("Missing or unknown origin");
    }

    res.set("Access-Control-Allow-Origin", req.headers.origin);
  }
  next();
});

// app.get("/", getUi)
// app.get("/:resource.:ext", getAsset)

app.get(audioPath, getAudio);

app.get(dataPath + "/:data.json", getData);
// TODO: use workbook to save json
// app.put(dataPath, putData); // firebase not needed? use save?

app.get(sheetPath, getWorkbookXS);
app.put(sheetPath, putWorkbookXS);

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
