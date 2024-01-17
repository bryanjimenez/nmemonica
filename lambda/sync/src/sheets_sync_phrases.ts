import type * as express from "express";
import * as admin from "firebase-admin";
import * as md5 from "md5";
import type { RawPhrase } from "../../../src/typings/raw";
import { googleSheetId } from "./constants";
import { fetchGSheetsData } from "./sheets";

type Phrase = Omit<RawPhrase, "uid">;

export function getParticles(tag: string) {
  const tagList = tag.split(/[\n\s ]+/);
  const h = "[\u3041-\u309F]{1,4}"; // hiragana particle
  const hasParticle = new RegExp("p:" + h + "(," + h + ")*");
  const nonWhiteSpace = new RegExp(/\S/);

  let remainingTags: string[] = [];
  let particles: string[] = [];
  tagList.forEach((t: string) => {
    switch (t) {
      case hasParticle.test(t) && t:
        particles = t.split(":")[1].split(",");
        break;
      default:
        if (t && nonWhiteSpace.test(t)) {
          // don't add empty whitespace
          if (remainingTags.length === 0) {
            remainingTags = [t];
          } else {
            remainingTags = [...remainingTags, t];
          }
        }
    }
  });

  return { tags: remainingTags, particles };
}

export async function sheets_sync_phrases(
  req: express.Request,
  res: express.Response
) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Phrases!A1:H";

    const sheetData = await fetchGSheetsData(spreadsheetId, range);

    const phrasesSnapshot = await admin
      .database()
      .ref("lambda/phrases")
      .once("value");

    const phrasesBefore = phrasesSnapshot.val();

    const JP = 0,
      // ORDER = -1,
      RM = 1,
      EN = 2,
      LIT = 3,
      GRP = 4,
      SUBG = 5,
      LSN = 6,
      TAG = 7;

    // let sheetHeaders = [];
    const phrasesAfter = sheetData.reduce<Record<string, Phrase>>(
      (acc, el, i) => {
        if (i > 0) {
          let phrase: Phrase = {
            japanese: el[JP],
            english: el[EN],
          };

          const key = md5(phrase.japanese);

          if (el[LIT] && el[LIT] !== "") {
            phrase.lit = el[LIT];
          }

          if (el[GRP] && el[GRP] !== "") {
            phrase.grp = el[GRP];
          }

          if (el[SUBG] && el[SUBG] !== "") {
            phrase.subGrp = el[SUBG];
          }

          if (el[RM] && el[RM] !== "") {
            phrase.romaji = el[1];
          } else if (
            phrasesBefore &&
            phrasesBefore[key] &&
            phrasesBefore[key].romaji
          ) {
            phrase.romaji = phrasesBefore[key].romaji;
          }

          if (el[LSN] && el[LSN] !== "") {
            phrase.lesson = el[LSN];
          }

          if (el[TAG] && el[TAG] !== "") {
            const { tags, particles } = getParticles(el[TAG]);

            if (tags.length > 0) {
              phrase.tag = tags;
            }

            if (particles.length > 0) {
              phrase.particles = particles;
            }
          }

          acc[key] = phrase;
        }
        // else {
        //   sheetHeaders = el;
        // }
        return acc;
      },
      {}
    );

    admin.database().ref("lambda/phrases").set(phrasesAfter);
    admin
      .database()
      .ref("lambda/cache")
      .update({ phrases: md5(JSON.stringify(phrasesAfter)).slice(0, 4) });

    res.sendStatus(200);
  } catch (e) {
    if (e instanceof Error) {
      console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    }
    res.sendStatus(500);
  }
}
