"use strict";
// The Firebase Admin SDK to access the Firebase Realtime Database.
import { default as admin } from "firebase-admin";
import { google } from "googleapis";
import { googleSheetId } from "../../../environment.development.js";
import md5 from "md5";

export async function sheets_sync_jlpt_n5(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "JLPT_N5!A1:D";

    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const api = google.sheets({ version: "v4", auth });

    const sheetDataPromise = new Promise((res, rej) => {
      api.spreadsheets.values.get({ spreadsheetId, range }, (err, response) => {
        if (err) {
          rej(new Error("The API returned an error: " + err));
        }
        const rows = response.data.values;
        res(rows);
      });
    });
    const vocabularyPromise = admin
      .database()
      .ref("lambda/jlptn5")
      .once("value");

    const [sheetData, vocabularySnapshot] = await Promise.all([
      sheetDataPromise,
      vocabularyPromise,
    ]);
    const vocabularyBefore = vocabularySnapshot.val();

    const JP = 0,
      RM = 1,
      EN = 2,
      GRP = 3,
      UID = 4;

    let sheetHeaders = [];
    const vocabularyAfter = sheetData.reduce((acc, el, i) => {
      if (i > 0) {
        const vocabulary = {
          japanese: el[JP],
          romaji: el[RM],
          english: el[EN],
        };

        const key = md5(vocabulary.japanese);

        if (el[GRP] && el[GRP] !== "") {
          vocabulary.grp = el[GRP];
        }

        // if (el[UID] && el[UID] !== "") {
        //   vocabulary.uid = el[UID];
        // }

        if (el[1] && el[1] !== "") {
          vocabulary.romaji = el[1];
        } else if (
          vocabularyBefore &&
          vocabularyBefore[key] &&
          vocabularyBefore[key].romaji
        ) {
          vocabulary.romaji = vocabularyBefore[key].romaji;
        }

        acc[key] = vocabulary;
      } else {
        sheetHeaders = el;
      }
      return acc;
    }, {});

    admin.database().ref("lambda/jlptn5").set(vocabularyAfter);
    admin
      .database()
      .ref("lambda/cache")
      .update({ jlptn5: md5(JSON.stringify(vocabularyAfter)).substr(0, 4) });

    return res.sendStatus(200);
  } catch (e) {
    console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    return res.sendStatus(500);
  }
}
