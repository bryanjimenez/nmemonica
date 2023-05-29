import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { romajiParticle } from "../helper/kanaHelper";
import { JapaneseText } from "../helper/JapaneseText";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";

import { buildPhraseArray, getPhrase } from "./phraseSlice";

/**
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../components/Games/ParticlesGame").ParticleChoice} ParticleChoice
 * @typedef {import("../components/Games/ParticlesGame").ParticleGamePhrase} ParticleGamePhrase
 */

export const getParticleGame = createAsyncThunk(
  "particle/getParticleGame",
  async (arg, thunkAPI) => {
    const state = /** @type {RootState} */ (thunkAPI.getState()).particle;
    const phrases = /** @type {RootState} */ (thunkAPI.getState()).phrases
      .value;

    if (phrases.length > 0) {
      const needGame = state.particleGame.phrases.length === 0;
      let game = undefined;
      if (needGame) {
        game = buildParticleGame(phrases);
      }
      return { game };
    } else {
      return thunkAPI.dispatch(getPhrase()).then((res) => {
        const rawObject =
          /** @type {{value:{[uid: string]: RawPhrase }, version: string}} */ (
            res.payload
          );
        const phraseObject = rawObject.value;
        const phraseArray = buildPhraseArray(phraseObject);
        return { phrase: phraseArray, game: buildParticleGame(phraseArray) };
      });
    }
  }
);

export const particleFromLocalStorage = createAsyncThunk(
  "particleGame/particleFromLocalStorage",
  /** @param {typeof initialState['setting']} arg */
  async (arg) => {
    const initValues = arg;

    return initValues;
  }
);

/**
 * Filters RawPhrase to be used by PhrasesGame
 * @param {RawPhrase[]} rawPhrases
 */
export function buildParticleGame(rawPhrases) {
  /** @type {ParticleChoice[]} */
  let particleList = [];
  /** @type {{[english:string]:{}}} */
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
  particleGame: {
    phrases: /** @type {ParticleGamePhrase[]} */ ([]),
    particles: /** @type {ParticleChoice[]} */ ([]),
  },

  setting: {
    aRomaji: false,
  },
};

const particleSlice = createSlice({
  name: "particleGame",
  initialState,
  reducers: {
    setParticlesARomaji(state) {
      state.setting.aRomaji = localStoreAttrUpdate(
        new Date(),
        { particle: state.setting },
        "/particle/",
        "aRomaji"
      );
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getParticleGame.fulfilled, (state, action) => {
      const { game } = action.payload;

      if (game) {
        state.particleGame = game;
      }
    });

    builder.addCase(particleFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(initialState.setting, localStorageValue);

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });
  },
});

export const { setParticlesARomaji } = particleSlice.actions;
export default particleSlice.reducer;
