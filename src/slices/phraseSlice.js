import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import { buildGroupObject } from "../helper/reducerHelper";
import { romajiParticle } from "../helper/kanaHelper";
import { JapaneseText } from "../helper/JapaneseText";

/**
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../components/Games/ParticlesGame").ParticleChoice} ParticleChoice
 * @typedef {import("../components/Games/ParticlesGame").ParticleGamePhrase} ParticleGamePhrase
 */

const buildPhraseArray = (object) =>
  Object.keys(object).map((k) => ({
    ...object[k],
    uid: k,
  }));

/**
 * Fetch phrases
 */
export const getPhrase = createAsyncThunk(
  "phrase/getPhrase",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState();
    const version = state.version.phrases || 0;

    if (version === 0) {
      console.error("fetching phrase: 0");
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/phrases.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

export const getParticleGame = createAsyncThunk(
  "phrase/getParticleGame",
  async (arg, thunkAPI) => {
    const phrases = thunkAPI.getState().phrases.value;

    if (phrases.length > 0) {
      const needGame =
        thunkAPI.getState().phrases.particleGame.phrases.length === 0;
      if (needGame) {
        return { game: buildParticleGame(phrases) };
      }
    } else {
      return thunkAPI.dispatch(getPhrase()).then((res) => {
        const phraseObject = res.payload;
        const phraseArray = buildPhraseArray(phraseObject);
        return { phrase: phraseArray, game: buildParticleGame(phraseArray) };
      });
    }
  }
);
/**
 * Filters RawPhrase to be used by PhrasesGame
 * @param {RawPhrase[]} rawPhrases
 */
export function buildParticleGame(rawPhrases) {
  /** @type {ParticleChoice[]} */
  let particleList = [];
  /** @type {ParticleGamePhrase[]} */
  let multipleMatch = {};

  const wParticles = rawPhrases.reduce(
    (/** @type {ParticleGamePhrase[]} */ acc, curr) => {
      if (curr.particles && curr.particles?.length > 0) {
        const phrase = JapaneseText.parse(curr);
        const spelling = phrase.getSpelling();

        curr.particles.forEach((p) => {
          if (spelling.split(p).length === 2) {
            const romaji = romajiParticle(p);
            const start = spelling.indexOf(p);
            const end = start + p.length;
            const particle = { japanese: p, romaji, html: p };
            const particleCopy = {
              japanese: p,
              romaji,
              start,
              end,
              html: p,
            };

            particleList = [...particleList, particle];
            acc = [
              ...acc,
              {
                answer: particleCopy,
                question: curr,
                english: curr.english,
                literal: curr.lit,
              },
            ];
          } else {
            // FIXME: more than one match
            // de vs desu 17612a51a05ef2e9fcc9e67f99f4836f
            // 3c87cb186cc3d94c47d901318fb74252
            // deaab959582cef2051b908d4d6421e00

            // toka, toka 88de5ed206433c2acc88cf61d900ce52
            // mo f919e262650b21a4c7c52be575554f59

            // haha deaab959582cef2051b908d4d6421e00
            multipleMatch = {
              ...multipleMatch,
              [curr.english]: {
                japanese: spelling,
                particle: p,
                times: spelling.split(p).length,
              },
            };
          }
        });
      }

      return acc;
    },
    []
  );
  console.error("More than one match " + Object.keys(multipleMatch).length);
  console.table(multipleMatch);

  return { phrases: wParticles, particles: particleList };
}

export const initialState = {
  value: /** @type {RawPhrase[]} */ ([]),
  grpObj: {},
  particleGame: {
    phrases: /** @type {ParticleGamePhrase[]} */ ([]),
    particles: /** @type {ParticleChoice[]} */ ([]),
  },
};

const phraseSlice = createSlice({
  name: "phrase",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(getPhrase.fulfilled, (state, action) => {
      state.grpObj = buildGroupObject(action.payload);
      state.value = buildPhraseArray(action.payload);
    });

    builder.addCase(getParticleGame.fulfilled, (state, action) => {
      const { phrase, game } = action.payload;

      if (game) {
        state.particleGame = game;
      }

      if (phrase) {
        state.value = phrase;
      }
    });
  },
});

export default phraseSlice.reducer;
