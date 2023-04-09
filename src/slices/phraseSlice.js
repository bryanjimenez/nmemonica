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

/**
 * Fetch vocabulary
 */
export const getPhrase = createAsyncThunk(
  "phrase/getPhrase",
  async (v, thunkAPI) => {
    const state = thunkAPI.getState();
    const version = state.version.phrases || 0;

    if(version===0){
      console.error('fetching phrase: 0')
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/phrases.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

/**
 * Filters RawPhrase to be used by PhrasesGame
 * @param {RawPhrase[]} rawPhrases
 */
export function getParticleGame(rawPhrases) {
  /** @type {ParticleChoice[]} */
  let particleList = [];
  /** @type {ParticleGamePhrase[]} */
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
            const particle = { japanese: p, romaji, toHTML: () => p };
            const particleCopy = {
              japanese: p,
              romaji,
              start,
              end,
              toHTML: () => p,
            };

            particleList = [...particleList, particle];
            acc = [
              ...acc,
              {
                answer: particleCopy,
                question: phrase,
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
            console.error(
              JSON.stringify({ split: spelling.split(p).length, curr, p })
            );
          }
        });
      }

      return acc;
    },
    []
  );

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
  reducers: {
    getParticleGamePhrases(state, action) {
      return {
        ...state,
        particleGame: getParticleGame(action.payload),
        value: action.payload,
      };
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getPhrase.fulfilled, (state, action) => {
      const value = Object.keys(action.payload).map((k) => ({
        ...action.payload[k],
        uid: k,
      }));

      state.grpObj = buildGroupObject(action.payload);
      state.value = value;
    });
  },
});

export const { getParticleGamePhrases } = phraseSlice.actions;
export default phraseSlice.reducer;
