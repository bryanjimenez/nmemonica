import * as express from "express";
import * as admin from "firebase-admin";
import { google } from "googleapis";
import { googleSheetId } from "./constants"; // FIXME: import { googleSheetId } from "../../../environment.development";
import * as md5 from "md5";

// TODO: use main type
type Phrase = {
  japanese: string;
  romaji?: string;
  english: string;
  lit?: string,
  grp?: string;
  subGrp?: string;

  tag?:string[],
  lesson?: string,
  particles?: string[],
}

export function getParticles(tag:string) {
  const tagList = tag.split(/[\n\s ]+/);
  const h = "[\u3041-\u309F]{1,4}"; // hiragana particle
  const hasParticle = new RegExp("p:" + h + "(," + h + ")*");
  const nonWhiteSpace = new RegExp(/\S/);

  let remainingTags:string[] = [];
  let particles:string[] = [];
  tagList.forEach((t:string) => {
    switch (t) {
      case hasParticle.test(t) && t:
        particles = t.split(":")[1].split(",");
        break;
      default:
        if (t && nonWhiteSpace.test(t)) {
          // don't add empty whitespace
          if (!remainingTags || remainingTags.length === 0) {
            remainingTags = [t];
          } else {
            remainingTags = [...remainingTags, t];
          }
        }
    }
  });

  return { tags: remainingTags, particles };
}

export async function sheets_sync_phrases(req: express.Request, res: express.Response) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Phrases!A1:H";

    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const api = google.sheets({ version: "v4", auth });

    const sheetDataPromise: Promise<string[][]>  = new Promise((resolve, reject) => {
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
    const phrasesPromise = admin.database().ref("lambda/phrases").once("value");

    const [sheetData, phrasesSnapshot] = await Promise.all([
      sheetDataPromise,
      phrasesPromise,
    ]);
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
    const phrasesAfter = sheetData.reduce<{[uid: string]:Phrase}>((acc, el, i) => {
      if (i > 0) {
        let phrase:Phrase = {
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

          if (tags && tags.length > 0) {
            phrase.tag = tags;
          }

          if (particles && particles.length > 0) {
            phrase.particles = particles;
          }
        }

        acc[key] = phrase;
      } 
      // else {
      //   sheetHeaders = el;
      // }
      return acc;
    }, {});

    admin.database().ref("lambda/phrases").set(phrasesAfter);
    admin
      .database()
      .ref("lambda/cache")
      .update({ phrases: md5(JSON.stringify(phrasesAfter)).slice(0, 5) });

    res.sendStatus(200);
  } catch (e) {
    if(e instanceof Error){
      console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
    }
    res.sendStatus(500);
  }
}
