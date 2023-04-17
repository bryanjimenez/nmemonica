import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { firebaseConfig } from "../../environment.development";
import {
  buildGroupObject,
  buildVocabularyObject,
} from "../helper/reducerHelper";
import {
  TermFilterBy,
  TermSortBy,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import { getVerbFormsArray } from "../helper/gameHelper";

/**
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 */

/**
 * Fetch vocabulary
 */
export const getVocabulary = createAsyncThunk(
  "vocabulary/getVocabulary",
  async (arg, thunkAPI) => {
    const state = /** @type {RootState} */ (thunkAPI.getState());
    const version = state.version.vocabulary || "0";

    if (version === "0") {
      console.error("fetching vocabulary: 0");
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/vocabulary.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

export const updateSpaceRepWord = createAsyncThunk(
  "vocabulary/updateSpaceRepWord",
  /** @argument {{uid:string, shouldIncrement?:boolean}} arg */
  async (arg, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = /** @type {RootState} */ (thunkAPI.getState()).vocabulary;

    const spaceRep = state.setting.repetition;

    return updateSpaceRepTerm(uid, spaceRep, shouldIncrement);
  }
);

export const vocabularyFromLocalStorage = createAsyncThunk(
  "vocabulary/vocabularyFromLocalStorage",
  /** @param {typeof initialState['setting']} arg */
  async (arg) => {
    const initValues = arg;

    return initValues;
  }
);

export const initialState = {
  value: /** @type {RawVocabulary[]} */ ([]),
  grpObj: {},
  verbForm: "dictionary",

  setting: {
    ordered: /** @type {TermSortBy[keyof TermSortBy]} */ (0),
    practiceSide: false,
    romaji: false,
    bareKanji: false,
    hintEnabled: false,
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (0),
    reinforce: false,
    repetition: /** @type {import("../typings/raw").SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    autoVerbView: false,
    verbColSplit: 0,
    verbFormsOrder: getVerbFormsArray().map((f) => f.name),
  },
};

const vocabularySlice = createSlice({
  name: "vocabulary",
  initialState,
  reducers: {
    verbFormChanged(state, action) {
      return {
        ...state,
        verbForm: action.payload,
      };
    },

    toggleVocabularyActiveGrp: (state, action) => {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue = grpParse(groups, activeGroup);

      state.setting.activeGroup = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "activeGroup",
        newValue
      );
    },

    furiganaToggled(state, action) {
      const uid = action.payload;

      const { value: newValue } = updateSpaceRepTerm(
        uid,
        state.setting.repetition,
        false,
        {
          toggle: ["f"],
        }
      );

      state.setting.repetition = newValue;
    },

    toggleVocabularyReinforcement(state) {
      state.setting.reinforce = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "reinforce"
      );
    },

    toggleVocabularyOrdering(state) {
      const { ordered } = state.setting;

      const newOrdered = /** @type {typeof TermSortBy[keyof TermSortBy]} */ (
        ordered + 1 < Object.keys(TermSortBy).length ? ordered + 1 : 0
      );

      state.setting.ordered = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "ordered",
        newOrdered
      );
    },

    flipVocabularyPracticeSide(state) {
      state.setting.practiceSide = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "practiceSide"
      );
    },

    toggleVocabularyRomaji(state) {
      state.setting.romaji = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "romaji"
      );
    },

    toggleVocabularyBareKanji(state) {
      state.setting.bareKanji = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "bareKanji"
      );
    },

    toggleVocabularyHint(state) {
      state.setting.hintEnabled = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "hintEnabled"
      );
    },

    toggleVocabularyFilter(state, action) {
      const allowed = /** @type {number[]} */ ([
        TermFilterBy.FREQUENCY,
        TermFilterBy.GROUP,
      ]);

      const override = action.payload;
      const { filter, reinforce } = state.setting;

      const newFilter = /** @type {typeof TermFilterBy[keyof TermFilterBy]}*/ (
        toggleAFilter(filter + 1, allowed, override)
      );

      state.setting.filter = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "filter",
        newFilter
      );

      if (newFilter !== 0 && reinforce) {
        state.setting.reinforce = false;
      }
    },

    setVerbFormsOrder(state, action) {
      /** @type {string[]} */
      const order = action.payload;
      state.setting.verbFormsOrder = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "verbFormsOrder",
        order
      );
    },

    toggleAutoVerbView(state) {
      state.setting.autoVerbView = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "autoVerbView"
      );
    },

    updateVerbColSplit(state, action) {
      /** @type {number} */
      const split = action.payload;
      state.setting.verbColSplit = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "verbColSplit",
        split
      );
    },

    addFrequencyWord(state, action) {
      const uid = action.payload;

      const { value: newValue } = updateSpaceRepTerm(
        uid,
        state.setting.repetition,
        false,
        {
          set: { rein: true },
        }
      );

      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );

      const frequency = { uid, count: state.setting.frequency.count + 1 };

      state.setting.frequency = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "frequency",
        frequency
      );
    },

    removeFrequencyWord(state, action) {
      const uid = action.payload;
      const spaceRep = state.setting.repetition;

      if (spaceRep[uid]?.rein === true) {
        // null to delete
        const { value: newValue } = updateSpaceRepTerm(uid, spaceRep, false, {
          set: { rein: null },
        });

        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );

        const frequency = { uid, count: state.setting.frequency.count - 1 };

        state.setting.frequency = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "frequency",
          frequency
        );
      }
    },

    setWordDifficulty: {
      reducer: (state, /** @type {import("@reduxjs/toolkit").PayloadAction<{uid:string, value:number}>}*/ action) => {
        const { uid, value } = action.payload;

        const { value: newValue } = updateSpaceRepTerm(
          uid,
          state.setting.repetition,
          false,
          {
            set: { difficulty: value },
          }
        );

        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      },
      prepare: (uid, value) => ({ payload: { uid, value } }),
    },
    setWordTPCorrect: {
      reducer: (state, /** @type {import("@reduxjs/toolkit").PayloadAction<{uid:string, tpElapsed:number, pronunciation:boolean}>}*/ action) => {
        const { uid, tpElapsed, pronunciation } = action.payload;

        const spaceRep = state.setting.repetition;

        let newPlayCount = 1;
        let newAccuracy = 1.0;
        let newCorrAvg = tpElapsed;

        if (spaceRep[uid]) {
          const playCount = spaceRep[uid].tpPc;
          const accuracy = spaceRep[uid].tpAcc;
          const correctAvg = spaceRep[uid].tpCAvg || 0;

          if (playCount !== undefined && accuracy != undefined) {
            newPlayCount = playCount + 1;

            const scores = playCount * accuracy;
            newAccuracy = (scores + 1.0) / newPlayCount;

            const correctCount = scores;
            const correctSum = correctAvg * correctCount;
            newCorrAvg = (correctSum + tpElapsed) / (correctCount + 1);
          }
        }

        const o = {
          ...(spaceRep[uid] || {}),
          pron:
            pronunciation === null || spaceRep[uid] === undefined
              ? undefined
              : spaceRep[uid].pron,
          tpPc: newPlayCount,
          tpAcc: newAccuracy,
          tpCAvg: newCorrAvg,
        };

        const newValue = { ...spaceRep, [uid]: o };
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      },
      prepare: (uid, tpElapsed, { pronunciation } = {}) => ({
        payload: { uid, tpElapsed, pronunciation },
      }),
    },
    setWordTPIncorrect: {
      reducer: (state, /** @type {import("@reduxjs/toolkit").PayloadAction<{uid:string, pronunciation:boolean}>}*/ action) => {
        const { uid, pronunciation } = action.payload;

        const spaceRep = state.setting.repetition;

        let newPlayCount = 1;
        let newAccuracy = 0;

        if (spaceRep[uid]) {
          const playCount = spaceRep[uid].tpPc;
          const accuracy = spaceRep[uid].tpAcc;

          if (playCount !== undefined && accuracy != undefined) {
            newPlayCount = playCount + 1;

            const scores = playCount * accuracy;
            newAccuracy = (scores + 0) / newPlayCount;
          }
        }

        const o = {
          ...(spaceRep[uid] || {}),
          tpPc: newPlayCount,
          tpAcc: newAccuracy,
          pron: pronunciation,
        };

        const newValue = { ...spaceRep, [uid]: o };
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      },
      prepare: (uid, { pronunciation } = {}) => ({
        payload: { uid, pronunciation },
      }),
    },
  },

  extraReducers: (builder) => {
    builder.addCase(vocabularyFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(initialState.setting, localStorageValue);

      // calculated values
      const vocabReinforceList = Object.keys(mergedSettings.repetition).filter(
        (k) => mergedSettings.repetition[k]?.rein === true
      );
      mergedSettings.frequency = {
        uid: undefined,
        count: vocabReinforceList.length,
      };

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });

    builder.addCase(getVocabulary.fulfilled, (state, action) => {
      state.grpObj = buildGroupObject(action.payload);
      state.value = buildVocabularyObject(action.payload);
    });

    builder.addCase(updateSpaceRepWord.fulfilled, (state, action) => {
      const { value: newValue } = action.payload;

      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );
    });
  },
});

export const {
  verbFormChanged,
  furiganaToggled,
  removeFrequencyWord,
  setVerbFormsOrder,
  toggleVocabularyOrdering,
  toggleVocabularyActiveGrp,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  toggleVocabularyHint,
  toggleVocabularyReinforcement,
  toggleVocabularyRomaji,
  updateVerbColSplit,
  toggleVocabularyBareKanji,
  flipVocabularyPracticeSide,
  addFrequencyWord,

  setWordDifficulty,
  setWordTPCorrect,
  setWordTPIncorrect,
} = vocabularySlice.actions;
export default vocabularySlice.reducer;
