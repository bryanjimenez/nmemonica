"use strict";
import { default as admin } from "firebase-admin";
import { google } from "googleapis";
import { googleSheetId } from "../../../environment.development.js";
import md5 from "md5";

export async function sheets_sync_phrases(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Phrases!A1:D";

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
    const phrasesPromise = admin.database().ref("lambda/phrases").once("value");

    const [sheetData, phrasesSnapshot] = await Promise.all([
      sheetDataPromise,
      phrasesPromise,
    ]);
    const phrasesBefore = phrasesSnapshot.val();

    let sheetHeaders = [];
    const phrasesAfter = sheetData.reduce((acc, el, i) => {
      if (i > 0) {
        const phrase = {
          japanese: el[0],
          english: el[2],
        };

        const key = md5(phrase.japanese);

        if (el[3] && el[3] !== "") {
          phrase.uid = el[3];
        }

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

    admin.database().ref("lambda/phrases").set(phrasesAfter);
    admin
      .database()
      .ref("lambda/cache")
      .update({ phrases: md5(phrasesAfter).substr(0, 4) });

    return res.sendStatus(200);
  } catch (e) {
    console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    return res.sendStatus(500);
  }
}
