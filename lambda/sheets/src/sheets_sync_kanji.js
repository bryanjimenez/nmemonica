"use strict";
// The Firebase Admin SDK to access the Firebase Realtime Database.
import { default as admin } from "firebase-admin";
import { google } from "googleapis";
import { googleSheetId } from "../../../environment.development.js";
import md5 from "md5";

function setPropsFromTags(el, tag) {
  const tags = tag.split(/[\n\s, ]+/);

  tags.forEach((t) => {
    switch (t) {
      case "slang":
        el.slang = true;
        break;
      default:
        if (!el.tag || el.tag.length === 0) {
          el.tag = [t];
        } else {
          el.tag = [...el.tag, t];
        }
    }
  });

  return el;
}

export async function sheets_sync_kanji(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Kanji!A1:G";

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

    const [sheetData] = await Promise.all([sheetDataPromise]);

    const KANJI = 0,
      EN = 1,
      ON = 2,
      KUN = 3,
      EX = 4,
      GRP = 5,
      TAG = 6;

    let sheetHeaders = [];
    const kanjiList = sheetData.reduce((acc, el, i) => {
      if (i > 0) {
        let kanji = {
          kanji: el[KANJI],
          eng: el[EN],
        };

        const key = md5(kanji.kanji);

        if (el[ON] && el[ON] !== "") {
          kanji.on = el[ON];
        }

        if (el[KUN] && el[KUN] !== "") {
          kanji.kun = el[KUN];
        }

        if (el[EX] && el[EX] !== "") {
          kanji.ex = el[EX];
        }

        if (el[GRP] && el[GRP] !== "") {
          kanji.grp = el[GRP];
        }

        if (el[TAG] && el[TAG] !== "") {
          kanji = setPropsFromTags(kanji, el[TAG]);
        }

        acc[key] = kanji;
      } else {
        sheetHeaders = el;
      }
      return acc;
    }, {});

    admin.database().ref("lambda/kanji").set(kanjiList);

    admin
      .database()
      .ref("lambda/cache")
      .update({
        kanji: md5(JSON.stringify(kanjiList)).substr(0, 4),
      });

    return res.sendStatus(200);
  } catch (e) {
    console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    return res.sendStatus(500);
  }
}
