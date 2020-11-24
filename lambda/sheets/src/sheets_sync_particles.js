"use strict";
import "regenerator-runtime/runtime";

// The Firebase Admin SDK to access the Firebase Realtime Database.
import { default as admin } from "firebase-admin";

import { google } from "googleapis";

import { googleSheetId } from "../../../environment.development.js";

/**
 * particles
 * syncs google sheet data with firebase
 * https://developers.google.com/sheets/api/quickstart/js
 * https://stackoverflow.com/questions/44448029/how-to-use-google-sheets-api-while-inside-a-google-cloud-function
 */

function parser(s, particleList){
  let lastChunk = "";
  return s.split(" ").reduce(
    (acc, word) => {
      const sentence = [];
      const particles = [];

      if (particleList.indexOf(word) > -1) {
        // TODO: check if particle is last word in sentece and is followed by a punctuation mark
        if (lastChunk === "particle") {
          const lastParticle = acc.particles.pop() + " " + word;
          particles.push(lastParticle);
        } else {
          particles.push(word);
        }

        lastChunk = "particle";
      } else {
        if (lastChunk === "word") {
          const lastWord = acc.sentence.pop() + " " + word;
          sentence.push(lastWord);
        } else {
          sentence.push(word);
        }
        lastChunk = "word";
      }

      const o = {
        sentence: [...acc.sentence, ...sentence],
        particles: [...acc.particles, ...particles],
      };

      return o;
    },
    { sentence: [], particles: [] }
  );
}

export async function sheets_sync_particles(req, res) {
  try {
    const spreadsheetId = googleSheetId;
    const range = "Particles!A1:F";

    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const api = google.sheets({ version: "v4", auth });

    let sheetData = await new Promise((res, rej) => {
      api.spreadsheets.values.get({ spreadsheetId, range }, (err, response) => {
        if (err) {
          rej(new Error("The API returned an error: " + err));
        }
        const rows = response.data.values;
        res(rows);
      });
    });

    const japanseParticles = [
      "は",
      "が",
      "を",
      "に",
      "で",
      "へ",
      "の",
      "と",
      "も",
    ];
    const allChoices = ["wa", "ga", "o", "ni", "de", "e", "no", "to", "mo"];

    const particles = sheetData.reduce((acc2, el, i) => {
      if (i > 0) {
        const sentences = el[3] ? el[3].split("\n") : [];
        const engSentences = el[4] ? el[4].split("\n") : [];
        const jpSentences = el[5] ? el[5].split("\n") : [];

        const obj = sentences.map((s, idx) => {
          const romajiObj = parser(s,allChoices);
          // const jpObj = parser(jpSentences,japanseParticles);

          const o = {romaji:romajiObj};
          if (engSentences[idx]) o.english = engSentences[idx];
          if (jpSentences[idx]) o.japanese = jpSentences[idx];

          return o;
        });
        return [...acc2, ...obj];
      }

      return acc2;
    }, []);

    admin.database().ref("lambda/particles").set(particles);

    return res.status(200).json({ particles });
  } catch (e) {
    if (e.details) {
      console.error(e.details);
      return res.status(500).json(e.details);
    } else {
      console.error(e);
      return res.sendStatus(500);
    }
  }
}
