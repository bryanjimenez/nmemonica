import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import { buildGroupObject } from "../helper/reducerHelper";
import { romajiParticle } from "../helper/kanaHelper";
import { JapaneseText } from "../helper/JapaneseText";
import { localStoreAttrUpdate } from "./localStorageHelper";
import {
  ADD_SPACE_REP_PHRASE,
  TermFilterBy,
  TermSortBy,
  getLastStateValue,
  updateSpaceRepTerm,
} from "./settingHelper";

/**
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../components/Games/ParticlesGame").ParticleChoice} ParticleChoice
 * @typedef {import("../components/Games/ParticlesGame").ParticleGamePhrase} ParticleGamePhrase
 */

/** @param {{[uid:string]: RawPhrase}} object */
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
    const state = /** @type {RootState} */ (
      /** @type {RootState} */ (thunkAPI.getState())
    );
    const version = state.version.phrases || "0";

    if (version === "0") {
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
    /** @type {RootState} */
    const state = /** @type {RootState} */ (thunkAPI.getState());
    const phrases = state.phrases.value;

    if (phrases.length > 0) {
      const needGame =
        /** @type {RootState} */ (thunkAPI.getState()).phrases.particleGame
          .phrases.length === 0;
      if (needGame) {
        return { phrase: [], game: buildParticleGame(phrases) };
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

export const phraseSettings = {
  /**
   * Toggle between group, frequency, and tags filtering
   * @param {typeof TermFilterBy[keyof TermFilterBy]} [override]
   */
  togglePhrasesFilter(override) {
    const max = Object.values(TermFilterBy).length - 1;
    const allowed = /** @type {number[]} */ ([
      TermFilterBy.FREQUENCY,
      TermFilterBy.GROUP,
    ]);

    return (/** @type {SettingState}*/ state) => {
      const { filter, reinforce } = state.phrases;

      const path = "/phrases/";
      const attr = "filter";
      const time = new Date();

      let newFilter = filter + 1;
      if (override !== undefined) {
        newFilter = override;
      } else {
        while (!allowed.includes(newFilter) || newFilter > max) {
          newFilter = newFilter + 1 > max ? 0 : newFilter + 1;
        }
      }

      localStoreAttrUpdate(time, state, path, attr, newFilter);

      if (newFilter !== TermFilterBy.GROUP && reinforce) {
        phraseSettings.togglePhrasesReinforcement()(state);
      }

      return newFilter;
    };
  },

  togglePhrasesReinforcement() {
    return (/** @type {SettingState}*/ state) => {
      const path = "/phrases/";
      const attr = "reinforce";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  /**
   * @param {string} uid
   */
  addFrequencyPhrase(uid) {
    return (/** @type {SettingState} */ state) => {
      return updateSpaceRepTerm(ADD_SPACE_REP_PHRASE, uid, false, {
        set: { rein: true },
      })(state);
    };
  },

  /**
   * Removes frequency word
   * @param {string} uid
   */
  removeFrequencyPhrase(uid) {
    return (/** @type {SettingState} */ state) => {
      const path = "/phrases/";
      const attr = "repetition";

      const spaceRep = getLastStateValue(state, path, attr);

      if (spaceRep[uid]?.rein === true) {
        // update frequency list count
        const reinforceList = Object.keys(spaceRep).filter(
          (k) => spaceRep[k].rein === true
        );
        // null to delete
        const { value } = updateSpaceRepTerm(ADD_SPACE_REP_PHRASE, uid, false, {
          set: { rein: null },
        })(state);

        return { uid, count: reinforceList.length - 1, value };
      }
      return {};
    };
  },

  flipPhrasesPracticeSide() {
    return (/** @type {SettingState} */ state) => {
      const path = "/phrases/";
      const attr = "practiceSide";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  togglePhrasesRomaji() {
    return (/** @type {SettingState} */ state) => {
      const path = "/phrases/";
      const attr = "romaji";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  /**
   * @param {string} uid
   * @param {boolean} [shouldIncrement]
   */
  updateSpaceRepPhrase(uid, shouldIncrement = true) {
    return (/** @type {SettingState} */ state) =>
      updateSpaceRepTerm(ADD_SPACE_REP_PHRASE, uid, shouldIncrement)(state);
  },

  togglePhrasesOrdering() {
    const max = Object.values(TermSortBy).length - 1;
    const allowed = /** @type {number[]} */ ([
      TermSortBy.RANDOM,
      TermSortBy.VIEW_DATE,
    ]);

    return (/** @type {SettingState} */ state) => {
      const { ordered } = state.phrases;

      let newOrdered = ordered + 1;
      while (!allowed.includes(newOrdered) || newOrdered > max) {
        newOrdered = newOrdered + 1 > max ? 0 : newOrdered + 1;
      }

      const path = "/phrases/";
      const attr = "ordered";
      const time = new Date();
      localStoreAttrUpdate(time, state, path, attr, newOrdered);

      return newOrdered;
    };
  },

  // ParticleGame Setting
  setParticlesARomaji() {
    return (/** @type {SettingState} */ state) => {
      const path = "/particles/";
      const attr = "aRomaji";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },
};

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

      if (state.value.length === 0 && phrase.length > 0) {
        state.value = phrase;
      }
    });
  },
});

export default phraseSlice.reducer;
