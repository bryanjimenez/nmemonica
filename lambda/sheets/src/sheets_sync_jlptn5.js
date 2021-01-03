"use strict";
// The Firebase Admin SDK to access the Firebase Realtime Database.
import { default as admin } from "firebase-admin";

import { google } from "googleapis";
import { googleSheetId } from "../../../environment.development.js";
import md5 from "md5";

export async function sheets_sync_jlpt_n5(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "JLPT_N5!A1:C";

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
    const phrasesPromise = admin.database().ref("lambda/jlptn5").once("value");

    const [sheetData, phrasesSnapshot] = await Promise.all([
      sheetDataPromise,
      phrasesPromise,
    ]);
    const phrasesBefore = phrasesSnapshot.val();

    const JP = 0,RM = 1,EN = 2,UID = 3;

    let sheetHeaders = [];
    const phrasesAfter = sheetData.reduce((acc, el, i) => {
      if (i > 0) {
        const phrase = {
          japanese: el[JP],
          romaji: el[RM],
          english: el[EN],
        };

        const key = md5(phrase.japanese);

        // if (el[UID] && el[UID] !== "") {
        //   phrase.uid = el[UID];
        // }

        if (el[1] && el[1] !== "") {
          phrase.romaji = el[1];
        } else if (
          phrasesBefore &&
          phrasesBefore[key] &&
          phrasesBefore[key].romaji
        ) {
          phrase.romaji = phrasesBefore[key].romaji;
        }

        acc[key] = phrase;
      } else {
        sheetHeaders = el;
      }
      return acc;
    }, {});

    admin.database().ref("lambda/jlptn5").set(phrasesAfter);

    return res.sendStatus(200);
  } catch (e) {
    console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    return res.sendStatus(500);
  }
}
