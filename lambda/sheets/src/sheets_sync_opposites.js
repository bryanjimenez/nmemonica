"use strict";
import { default as admin } from "firebase-admin";
import { google } from "googleapis";
import { googleSheetId } from "../../../environment.development.js";
import md5 from "md5";

export async function sheets_sync_opposites(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Vocabulary!A1:I";

    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const api = google.sheets({ version: "v4", auth });

    const sheetData = await new Promise((res, rej) => {
      api.spreadsheets.values.get({ spreadsheetId, range }, (err, response) => {
        if (err) {
          rej(new Error("The API returned an error: " + err));
        }
        const rows = response.data.values;
        res(rows);
      });
    });

    let sheetHeaders = [];

    const ORDER = 0,
      JP = 1,
      RM = 2,
      EN = 3,
      GRP = 4,
      SUBG = 5,
      OPP = 8;
    // UID = 8;

    let pairs = [];
    const vocabulary = sheetData.reduce((acc, el, i) => {
      if (i > 0) {
        if (el[OPP] && el[OPP] !== "") {
          const key = md5(el[JP]);

          const relationship = el[OPP].split("\n");

          relationship.forEach((opposite) => {
            pairs.push({
              japanese: el[JP],
              romaji: el[RM],
              english: el[EN],
              opposite,
            });
          });

          return {
            ...acc,
            [key]: {
              japanese: el[JP],
              romaji: el[RM],
              english: el[EN],
            },
          };
        }
      } else {
        sheetHeaders = el;
      }
      return acc;
    }, {});

    const opposites = pairs.map((p) => [
      {
        japanese: p.japanese,
        romaji: p.romaji,
        english: p.english,
      },

      vocabulary[p.opposite],
    ]);

    admin.database().ref("lambda/opposites").set(opposites);
    admin
      .database()
      .ref("lambda/cache")
      .update({
        opposites: md5(JSON.stringify(opposites)).substr(0, 4),
      });

    // return res.status(200).json({ opposites });
    return res.sendStatus(200);
  } catch (e) {
    console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    return res.sendStatus(500);
  }
}
