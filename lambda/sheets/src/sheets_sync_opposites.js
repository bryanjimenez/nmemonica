"use strict";
import { default as admin } from "firebase-admin";
import { google } from "googleapis";
import { googleSheetId } from "../../../environment.development.js";
import md5 from "md5";

export async function sheets_sync_opposites(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Opposites!A1:F";

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

    const opposites = sheetData.reduce((acc, el, i) => {
      if (i > 0) {
        const pair = [
          {
            japanese: el[0],
            romaji: el[1],
            english: el[2],
          },

          { japanese: el[3], romaji: el[4], english: el[5] },
        ];

        acc.push(pair);
      } else {
        sheetHeaders = el;
      }

      return acc;
    }, []);

    admin.database().ref("lambda/opposites").set(opposites);
    admin
      .database()
      .ref("lambda/cache")
      .update({ opposites: md5(opposites).substr(0, 4) });

    return res.status(200).json({ opposites });
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
