import * as express from "express";
import * as admin from "firebase-admin";
import { google } from "googleapis";
import { googleSheetId } from "./constants"; // FIXME: import { googleSheetId } from "../../../environment.development";
import * as md5 from "md5";


// TODO: use main type
type Vocabulary = {
  japanese: string;
  romaji: string;
  english: string;
}

export async function sheets_sync_opposites(req: express.Request, res: express.Response) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Vocabulary!A1:I";

    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const api = google.sheets({ version: "v4", auth });

    const sheetData:string[][] = await new Promise((resolve, reject) => {
      api.spreadsheets.values.get({ spreadsheetId, range }, (err, response) => {
        if (err) {
          reject(new Error("The API returned an error: " + err));
        } else if(!response || !response.data || !response.data.values){
          reject(new Error("The API returned no data"));
        } else {
          const rows = response.data.values;
          resolve(rows);
        }
      });
    });

    // let sheetHeaders = [];

    const 
      JP = 1,
      RM = 2,
      EN = 3,
      // GRP = 4,
      // SUBG = 5,
      // ORDER = 0,
      OPP = 8;
    // UID = 8;
    

    type Pair = {japanese:string, romaji:string,english:string, opposite:string};
    let pairs:Pair[] = [];
    const vocabulary = sheetData.reduce<{[uid:string]: Vocabulary}>((acc, el, i) => {
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
      } 
      // else {
      //   sheetHeaders = el;
      // }
      return acc;
    }, {});

    const opposites:[Vocabulary, Vocabulary][] = pairs.map((p) => [
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
        opposites: md5(JSON.stringify(opposites)).slice(0, 5),
      });

    // return res.status(200).json({ opposites });
    res.sendStatus(200);
  } catch (e) {
    if(e instanceof Error){
    console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    }
    res.sendStatus(500);
  }
}
