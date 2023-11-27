import express from "express";
// import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { networkInterfaces } from "os";
import { getData } from "./data.js";
import { getWorkbookXS, putWorkbookXS } from "./workbook.js";
import { getAudio } from "./audio.js";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import 'dotenv/config'

const uiPort = process.env.UI_PORT
const servicePort:number = process.env.SERVICE_PORT
const audioPath = process.env.AUDIO_PATH;
const dataPath = process.env.DATA_PATH
const sheetPath = process.env.SHEET_PATH

if(!(uiPort && servicePort && audioPath && dataPath && sheetPath)){
  throw new Error("dotenv missing")
}

// Get OS's external facing ip
const n = networkInterfaces();
const ip = Object.values(n)
  .flat()
  .find(({ family, internal }) => family === "IPv4" && !internal);
const serviceIP = ip?.address;


const projectRoot = path.resolve();
export const CSV_DIR = path.normalize(`${projectRoot}/data/csv`);
export const JSON_DIR = path.normalize(`${projectRoot}/data/json`);

/** Permissions ------ */
const rl = readline.createInterface({ input, output });
const readGranted = await rl.question(`Grant DIR-READ access? "${JSON_DIR}" [y/n]\n`);
const writeGranted = await rl.question(`Grant DIR-WRITE access? "${CSV_DIR}" [y/n]\n`);
const netGranted = await rl.question(
  `Grant NETWORK access? "${serviceIP}:${servicePort}" [y/n]\n`,
);

if (readGranted?.toLowerCase() !== "y") {
  throw new Error(`Denied READ access "${JSON_DIR}"`);
}
if (writeGranted?.toLowerCase() !== "y") {
  throw new Error(`Denied WRITE access "${CSV_DIR}"`);
}
if (netGranted?.toLowerCase() !== "y") {
  throw new Error(`Denied NETWORK access "${serviceIP}:${servicePort}"`);
}
if (!fs.existsSync(CSV_DIR)) {
  const createIt = await rl.question(`Create required directory? "${CSV_DIR}" [y/n]\n`);
  if (createIt?.toLowerCase() === "y") {
    fs.mkdirSync(CSV_DIR, { recursive: true });
  } else {
    throw new Error(`Missing required directory "${CSV_DIR}"`);
  }
}
if (!fs.existsSync(JSON_DIR)) {
  const createIt = await rl.question(`Create required directory? "${JSON_DIR}" [y/n]\n`);
  if (createIt?.toLowerCase() === "y") {
    fs.mkdirSync(JSON_DIR, { recursive: true });
  } else {
    throw new Error(`Missing required directory "${JSON_DIR}"`);
  }
}
/** ------ Permissions */



export const allowedOrigins = [
  `https://localhost:${uiPort}`,
  `https://127.0.0.1:${uiPort}`,
  `https://${serviceIP}:${uiPort}`,
];


const privateKey = fs.readFileSync(
  projectRoot +"/"+ process.env.PATH_KEY,
  "utf8"
);
const certificate = fs.readFileSync(
  projectRoot +"/"+ process.env.PATH_CRT,
  "utf8"
);

const credentials = {
  key: privateKey,
  cert: certificate,
};

const app = express();
// app.use(express.json()) // for parsing application/json
// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// check origin from all requests
app.use((req, res, next) => {
  console.log(req.method + " " + req.url);

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

// const httpSever = http.createServer(app)
const httpsServer = https.createServer(credentials, app);

// const plainTPort = servicePort -1;
// httpSever.listen(plainTPort, serviceIP,0, () => {
//   console.log("workbook http service");
//   console.log(serviceIP+":"+plainTPort+"\n\n");
// });

httpsServer.listen(servicePort, serviceIP, 0, () => {
  console.log("workbook https service");
  console.log(serviceIP + ":" + servicePort + "\n\n");
});
