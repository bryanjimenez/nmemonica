import type * as express from "express";
import * as admin from "firebase-admin";
import { googleSheetId } from "./constants";
import * as md5 from "md5";
import type { Optional, RawKanji } from "../../../src/typings/raw";
import { fetchGSheetsData } from "./sheets";

type Kanji = Optional<RawKanji, "uid">;

function setPropsFromTags(el: Kanji, tag: string) {
  const tags = tag.split(/[,]+/);

  tags.forEach((t) => {
    t = t.trim();
    if (t.endsWith(",")) {
      t = t.slice(0, -1);
    }

    switch (t) {
      // case "slang":
      //   el.slang = true;
      //   break;
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

export async function sheets_sync_kanji(
  req: express.Request,
  res: express.Response
) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Kanji!A1:G";

    const sheetData = await fetchGSheetsData(spreadsheetId, range);

    const KANJI = 0,
      EN = 1,
      ON = 2,
      KUN = 3,
      GRP = 4,
      TAG = 5,
      RADEX = 6; // Radical: example usage in a Kanji

    // let sheetHeaders = [];
    const kanjiList = sheetData.reduce<Record<string, Kanji>>((acc, el, i) => {
      if (i > 0) {
        let kanji: Kanji = {
          kanji: el[KANJI],
          english: el[EN],
        };

        const key = md5(kanji.kanji);

        if (el[ON] && el[ON] !== "") {
          kanji.on = el[ON];
        }

        if (el[KUN] && el[KUN] !== "") {
          kanji.kun = el[KUN];
        }

        if (el[GRP] && el[GRP] !== "") {
          kanji.grp = el[GRP];
        }

        if (el[TAG] && el[TAG] !== "") {
          kanji = setPropsFromTags(kanji, el[TAG]);

          if (kanji.tag?.length === 0) {
            delete kanji.tag;
          }
        }

        if (el[RADEX] && el[RADEX] !== "") {
          kanji.radex = el[RADEX];
        }

        acc[key] = kanji;
      }
      // else {
      //   sheetHeaders = el;
      // }
      return acc;
    }, {});

    admin.database().ref("lambda/kanji").set(kanjiList);

    admin
      .database()
      .ref("lambda/cache")
      .update({
        kanji: md5(JSON.stringify(kanjiList)).slice(0, 4),
      });

    res.sendStatus(200);
  } catch (e) {
    if (e instanceof Error) {
      console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    }
    res.sendStatus(500);
  }
}
