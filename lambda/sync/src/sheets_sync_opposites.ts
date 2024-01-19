import type * as express from "express";
import * as admin from "firebase-admin";
import { googleSheetId } from "./constants";
import * as md5 from "md5";
import type { RawVocabulary } from "../../../src/typings/raw";
import { fetchGSheetsData } from "./sheets";

type Vocabulary = Omit<RawVocabulary, "uid" | "tags">;

export async function sheets_sync_opposites(
  req: express.Request,
  res: express.Response
) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Vocabulary!A1:I";

    const sheetData = await fetchGSheetsData(spreadsheetId, range);

    // let sheetHeaders = [];

    const JP = 1,
      RM = 2,
      EN = 3,
      // GRP = 4,
      // SUBG = 5,
      // ORDER = 0,
      OPP = 8;
    // UID = 8;

    interface Pair {
      japanese: string;
      romaji: string;
      english: string;
      opposite: string;
    }
    let pairs: Pair[] = [];
    const vocabulary = sheetData.reduce<Record<string, Vocabulary>>(
      (acc, el, i) => {
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
      },
      {}
    );

    const opposites: [Vocabulary, Vocabulary][] = pairs.map((p) => [
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
        opposites: md5(JSON.stringify(opposites)).slice(0, 4),
      });

    // return res.status(200).json({ opposites });
    res.sendStatus(200);
  } catch (e) {
    if (e instanceof Error) {
      console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    }
    res.sendStatus(500);
  }
}
