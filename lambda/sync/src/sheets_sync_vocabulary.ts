// The Firebase Admin SDK to access the Firebase Realtime Database.
import type * as express from "express";
import * as admin from "firebase-admin";
import { googleSheetId } from "./constants";
import * as md5 from "md5";
import type { RawVocabulary } from "../../../src/typings/raw";
import { fetchGSheetsData } from "./sheets";

type Vocabulary = Omit<RawVocabulary, "uid">;

function setPropsFromTags(vocabulary: Vocabulary, tag: string) {
  const tags = tag.split(/[\n\s, ]+/);

  tags.forEach((t) => {
    switch (t) {
      case "slang":
        vocabulary.slang = true;
        break;
      case "keigo":
        vocabulary.keigo = true;
        break;
      case "EV1":
        vocabulary.exv = 1;
        break;
      case "intr":
        vocabulary.intr = true;
        break;
      case new RegExp("intr:[a-z0-9]{32}").test(t) && t:
        vocabulary.trans = t.split(":")[1];
        break;
      case new RegExp("(i|na)-adj").test(t) && t:
        vocabulary.adj = t.split("-")[0];
        break;
      default:
        if (!vocabulary.tag || vocabulary.tag.length === 0) {
          vocabulary.tag = [t];
        } else {
          vocabulary.tag = [...vocabulary.tag, t];
        }
    }
  });

  return vocabulary;
}

export async function sheets_sync_vocabulary(
  req: express.Request,
  res: express.Response
) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Vocabulary!A1:H";

    const sheetData = await fetchGSheetsData(spreadsheetId, range);

    const vocabularySnapshot = await admin
      .database()
      .ref("lambda/vocabulary")
      .once("value");

    const vocabularyBefore = vocabularySnapshot.val();

    const JP = 1,
      // ORDER = 0,
      RM = 2,
      EN = 3,
      GRP = 4,
      SUBG = 5,
      PRN = 6,
      TAG = 7;
    // UID = 7;

    // let sheetHeaders = [];
    const vocabularyAfter = sheetData.reduce<Record<string, Vocabulary>>(
      (acc, el, i) => {
        if (i > 0) {
          let vocabulary: Vocabulary = {
            japanese: el[JP],
            romaji: el[RM],
            english: el[EN],
          };

          const key: string = md5(vocabulary.japanese);

          if (el[GRP] && el[GRP] !== "") {
            vocabulary.grp = el[GRP];
          }

          if (el[SUBG] && el[SUBG] !== "") {
            vocabulary.subGrp = el[SUBG];
          }

          if (el[PRN] && el[PRN] !== "") {
            vocabulary.pronounce = el[PRN];
          }

          if (el[TAG] && el[TAG] !== "") {
            vocabulary = setPropsFromTags(vocabulary, el[TAG]);
          }

          if (el[RM] && el[RM] !== "") {
            vocabulary.romaji = el[RM];
          } else if (
            vocabularyBefore &&
            vocabularyBefore[key] &&
            vocabularyBefore[key].romaji
          ) {
            vocabulary.romaji = vocabularyBefore[key].romaji;
          }

          acc[key] = vocabulary;
        }
        // else {
        //   sheetHeaders = el;
        // }
        return acc;
      },
      {}
    );

    admin.database().ref("lambda/vocabulary").set(vocabularyAfter);
    admin
      .database()
      .ref("lambda/cache")
      .update({
        vocabulary: md5(JSON.stringify(vocabularyAfter)).slice(0, 4),
      });

    res.sendStatus(200);
  } catch (e) {
    if (e instanceof Error) {
      console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    }
    res.sendStatus(500);
  }
}
