/*

  https://developers.google.com/sheets/api/quickstart/js
  https://stackoverflow.com/questions/44448029/how-to-use-google-sheets-api-while-inside-a-google-cloud-function

  https://console.cloud.google.com/cloudscheduler?project=nmemonica-5b353
*/

"use strict";
// The Firebase Admin SDK to access the Firebase Realtime Database.
import { default as admin } from "firebase-admin";

import { google } from "googleapis";
import { googleSheetId } from "../../../environment.development.js";

/**
 * syncs google sheet data with firebase
 * https://developers.google.com/sheets/api/quickstart/js
 * https://stackoverflow.com/questions/44448029/how-to-use-google-sheets-api-while-inside-a-google-cloud-function
 */
export async function sheets_sync_phrases(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Phrases!A1:D";

    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const api = google.sheets({ version: "v4", auth });

    let sheetData = await new Promise((res, rej) => {
      api.spreadsheets.values.get({ spreadsheetId, range }, (err, response) => {
        if (err) {
          rej(new Error("The API returned an error: " + err));
        }
        const rows = response.data.values;
        res(rows);
      });
    });

    let sheetHeaders = [];

    const phrases = sheetData.reduce((acc, el, i) => {

      if (i > 0) {
        const phrase = {
          japanese: el[0],
          romaji: el[1],
          english: el[2],
        };

        if(el[3] && el[3] !== ''){
          phrase.uid = el[3];
        }

        acc.push(phrase);
      } else {
        sheetHeaders = el;
      }

      return acc;
    }, []);

    admin.database().ref("lambda/phrases").set(phrases);

    return res.status(200).json({ phrases });
  } catch (e) {
    if (e.details) {
      console.error(e.details);
      return res.status(500).json(e.details);
    } else {
      console.error(e);
      return res.sendStatus(500);
    }
  }
}
