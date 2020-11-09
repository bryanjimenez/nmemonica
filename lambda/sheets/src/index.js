/*

  https://developers.google.com/sheets/api/quickstart/js
  https://stackoverflow.com/questions/44448029/how-to-use-google-sheets-api-while-inside-a-google-cloud-function

  https://console.cloud.google.com/cloudscheduler?project=nmemonica-5b353
*/

"use strict";
import "regenerator-runtime/runtime";
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
import { default as functions } from "firebase-functions";

// The Firebase Admin SDK to access the Firebase Realtime Database.
import { default as admin } from "firebase-admin";
admin.initializeApp();

import { google } from "googleapis";
import axios from "axios";

import { googleSheetId } from "../../../environment.development.js";

const PROJECT_REGION = "us-east1";
const CLOUD_FUNCTIONS_BASE_URL = `https://${PROJECT_REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net`;
const CLOUD_HOSTING_BASE_URL = [
  `https://${process.env.GCLOUD_PROJECT}.web.app`,
  `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com`,
];

/**
 * public function to bypass cors and call private fn sheets
 * https://github.com/firebase/firebase-tools/issues/842
 */
/*
exports.cors = functions
  .region(PROJECT_REGION)
  .https.onRequest(async (req, res) => {
    const originIdx = CLOUD_HOSTING_BASE_URL.indexOf(req.headers.origin);
    const origin =
      originIdx === -1
        ? CLOUD_HOSTING_BASE_URL[0]
        : CLOUD_HOSTING_BASE_URL[originIdx];
    res.set("Access-Control-Allow-Origin", origin);
    // res.set("Access-Control-Allow-Credentials", "true"); //needed when cookies need to be sent, not the case

    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "GET");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Access-Control-Allow-Headers", "Authorization");
      res.set("Access-Control-Max-Age", "3600");

      return res.sendStatus(204);
    } else if (
      req.method === "GET" &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      try {
        const id_token = req.headers.authorization.split("Bearer ")[1];

        const response = await axios({
          url: CLOUD_FUNCTIONS_BASE_URL + "/sheets",
          method: "POST",
          credentials: "include",
          headers: { Authorization: "Bearer " + id_token },
        });

        return res.status(200).send(response.data);
      } catch (e) {
        console.error(e.message);
        if (e.response && e.response.data) {
          return res.status(500).json(e.response.data);
        } else {
          return res.sendStatus(500);
        }
      }
    } else {
      return res.sendStatus(403);
    }
  });
*/

/**
 * syncs google sheet data with firebase
 * https://developers.google.com/sheets/api/quickstart/js
 * https://stackoverflow.com/questions/44448029/how-to-use-google-sheets-api-while-inside-a-google-cloud-function
 */
exports.sheets = functions
  .region(PROJECT_REGION)
  .https.onRequest(async (req, res) => {
    // res.set("Access-Control-Allow-Origin", CLOUD_FUNCTIONS_BASE_URL); //undo this!!

    // if (req.method === "OPTIONS") {
    //   res.set("Access-Control-Allow-Methods", "POST");
    //   res.set("Access-Control-Allow-Headers", "Content-Type");
    //   res.set("Access-Control-Allow-Headers", "Authorization");
    //   res.set("Access-Control-Max-Age", "3600");

    //   return res.sendStatus(204);
    // } else if (req.method === "GET") {
    try {
      const spreadsheetId = googleSheetId;
      const range = "Verbs!A1:K";

      const auth = await google.auth.getClient({
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });

      const api = google.sheets({ version: "v4", auth });

      let sheetData = await new Promise((res, rej) => {
        api.spreadsheets.values.get(
          { spreadsheetId, range },
          (err, response) => {
            if (err) {
              rej(new Error("The API returned an error: " + err));
            }
            const rows = response.data.values;
            res(rows);
          }
        );
      });

      const dupCheck = {};
      let duplicate = "";
      let emptyId = -1;
      let sheetHeaders = [];

      const verbs = sheetData.reduce((acc, el, i) => {
        if (el[0] === "") {
          emptyId = i;
        }

        if (dupCheck[el[0]]) {
          duplicate = el[0];
        } else {
          dupCheck[el[0]] = { id: el[0], name: el[1], price: el[3] };
        }

        if (i > 0 /*&& (!el[4] || el[4] === "")*/) {
          const id = el[0];

          let tenses = [];
          let idx = 3;
          // for (let idx = 3; idx < el.length; idx + 8) {
          const t = {
            t: sheetHeaders[idx],
            romaji: {
              plain_pos: el[idx],
              plain_pos_wav: el[idx + 1],
              plain_neg: el[idx + 2],
              plain_neg_wav: el[idx + 3],
              polite_pos: el[idx + 4],
              polite_pos_wav: el[idx + 5],
              polite_neg: el[idx + 6],
              polite_neg_wav: el[idx + 7],
            },
          };
          tenses.push(t);
          // }

          const v = {
            japanese: el[0],
            class: el[1],
            english: el[2],
            tenses,
          };

          acc.push(v);
        } else {
          sheetHeaders = el;
        }

        return acc;
      }, []);

      console.log(verbs);

      if (emptyId > -1) {
        const err = new Error("Missing Id");
        err.details = { error: "Missing Id", details: sheetData[emptyId] };
        throw err;
      }

      if (duplicate) {
        const err = new Error("Duplicate");
        err.details = { error: "Duplicate", details: dupCheck[duplicate] };
        throw err;
      }

      /*
        const rewards = sheetData.reduce((acc, el, i) => {
          if (i > 0 && el[4] && el[4] !== "") {
            const id = el[0].toLowerCase();
            const val = { id, name: el[1], price: el[3] };
            const obj = {};
            const key = el[4].toUpperCase();
            obj[key] = val;
            Object.assign(acc, obj);
          }

          return acc;
        }, {});
        */

      admin.database().ref("lambda/verbs").set(verbs);

      return res.status(200).json({ verbs });
    } catch (e) {
      if (e.details) {
        console.error(e.details);
        return res.status(500).json(e.details);
      } else {
        console.error(e);
        return res.sendStatus(500);
      }
    }
    // } else {
    //   return res.sendStatus(403);
    // }
  });
