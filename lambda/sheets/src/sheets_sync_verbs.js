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
export async function sheets_sync_verbs(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Verbs!A1:B";

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

    let emptyId = -1;
    let sheetHeaders = [];

    const verbs = sheetData.reduce((acc, el, i) => {
      if (el[0] === "") {
        emptyId = i;
      }

      if (i > 0) {
        const dictionary = el[0];

        const v = {
          japanese: { dictionary },
          english: el[1],
        };

        acc.push(v);
      } else {
        sheetHeaders = el;
      }

      return acc;
    }, []);

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
}
