import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { firebaseConfig } from "../../environment.development";
import { buildGroupObject } from "../helper/reducerHelper";
import { romajiParticle } from "../helper/kanaHelper";
import { JapaneseText } from "../helper/JapaneseText";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import {
  TermFilterBy,
  TermSortBy,
  grpParse,
  toggleAFilter,
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
    const state = /** @type {RootState} */ (thunkAPI.getState()).phrases;
    const phrases = state.value;

    if (phrases.length > 0) {
      const needGame = state.particleGame.phrases.length === 0;
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

export const phraseFromLocalStorage = createAsyncThunk(
  "phrase/phraseFromLocalStorage",
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

export const phraseSettings = {
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
export const updateSpaceRepPhrase = createAsyncThunk(
  "phrase/updateSpaceRepPhrase",
  async (arg, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = /** @type {RootState} */ (thunkAPI.getState()).phrases;

    const spaceRep = state.setting.repetition;

    return updateSpaceRepTerm(
      uid,
      spaceRep,
      shouldIncrement
    );
;  }
);

export const initialState = {
  value: /** @type {RawPhrase[]} */ ([]),
  grpObj: {},
  particleGame: {
    phrases: /** @type {ParticleGamePhrase[]} */ ([]),
    particles: /** @type {ParticleChoice[]} */ ([]),
  },

  setting: {
    ordered: /** @type {TermSortBy[keyof TermSortBy]} */ (0),
    practiceSide: false,
    romaji: false,
    reinforce: false,
    repetition: /** @type {import("../typings/raw").SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (0),
  },
};

const phraseSlice = createSlice({
  name: "phrase",
  initialState,
  reducers: {
    togglePhrasesFilter(state, action) {
      /**
       * Toggle between group, frequency, and tags filtering
       * @param {typeof TermFilterBy[keyof TermFilterBy]} [override]
       */
      const override = action.payload;

      const allowed = /** @type {number[]} */ ([
        TermFilterBy.FREQUENCY,
        TermFilterBy.GROUP,
      ]);

      const { filter, reinforce } = state.setting;

      const newFilter = toggleAFilter(filter + 1, allowed, override);

      state.setting.filter = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "filter",
        newFilter
      );

      if (newFilter !== TermFilterBy.GROUP && reinforce) {
        state.setting.reinforce = false;
      }
    },
    togglePhraseActiveGrp(state, action){
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue = grpParse(groups, activeGroup);
  
      state.setting.activeGroup = localStoreAttrUpdate(new Date(), {phrases: state.setting}, "/phrases/", "activeGroup", newValue);
    },
    togglePhrasesReinforcement(state) {
      state.setting.reinforce = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        'reinforce'
      );
    },

    addFrequencyPhrase(state, action) {
      const uid = action.payload;
      const { value: newValue } = updateSpaceRepTerm(uid, state.setting.repetition, false, {
        set: { rein: true },
      });

      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "repetition",
        newValue
      );

      let frequency = {uid, count: state.setting.frequency.count+1}
      state.setting.frequency = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "frequency",
        frequency
      );
    },

    removeFrequencyPhrase(state, action) {
      const uid = action.payload;

      const spaceRep = state.setting.repetition;
      if (spaceRep[uid]?.rein === true) {
        // null to delete
        const { value: newValue } = updateSpaceRepTerm(uid, spaceRep, false, {
          set: { rein: null },
        });

        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { phrases: state.setting },
          "/phrases/",
          "repetition",
          newValue
        );

        let frequency = {uid, count: state.setting.frequency.count-1}
        state.setting.frequency = localStoreAttrUpdate(
          new Date(),
          { phrases: state.setting },
          "/phrases/",
          "frequency",
          frequency
        );
      }
    },

    flipPhrasesPracticeSide(state) {
      state.setting.practiceSide = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "practiceSide"
      );
    },

    togglePhrasesRomaji(state) {
      state.setting.romaji = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "romaji"
      );
    },

    togglePhrasesOrdering(state) {
      const allowed = /** @type {number[]} */ ([
        TermSortBy.RANDOM,
        TermSortBy.VIEW_DATE,
      ]);

      const { ordered } = state.setting;

      let newOrdered = toggleAFilter(ordered + 1, allowed);

      state.setting.ordered = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "ordered",
        newOrdered
      );
    },
  },

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

    builder.addCase(phraseFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(initialState.setting, localStorageValue);

      const phraseReinforceList = Object.keys(
        mergedSettings.repetition
      ).filter((k) => mergedSettings.repetition[k]?.rein === true);
      mergedSettings.frequency = {
        uid: undefined,
        count: phraseReinforceList.length,
      };

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });
    builder.addCase(updateSpaceRepPhrase.fulfilled, (state, action) => {
      const { value: newValue } = action.payload;

      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "repetition",
        newValue
      );
    });
  },
});

export const {
  flipPhrasesPracticeSide,
  togglePhrasesRomaji,
  togglePhrasesFilter,
  togglePhraseActiveGrp,
  togglePhrasesReinforcement,
  addFrequencyPhrase,
  removeFrequencyPhrase,
  togglePhrasesOrdering,
} = phraseSlice.actions;
export default phraseSlice.reducer;
