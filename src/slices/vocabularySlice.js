import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import {
  buildGroupObject,
  buildVocabularyObject,
} from "../helper/reducerHelper";
import {
  ADD_SPACE_REP_WORD,
  TermFilterBy,
  TermSortBy,
  getLastStateValue,
  updateSpaceRepTerm,
} from "./settingHelper";
import { localStoreAttrUpdate } from "./localStorageHelper";

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

export const vocabularySettings = {
  /**
   * @param {string} uid
   */
  toggleFurigana(uid) {
    return (/** @type {SettingState} */ state) => {
      const { value } = updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, {
        toggle: ["f"],
      })(state);

      return value;
    };
  },

  toggleVocabularyReinforcement() {
    return (/** @type {SettingState} */ state) => {
      const path = "/vocabulary/";
      const attr = "reinforce";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  toggleVocabularyOrdering() {
    return (/** @type {SettingState} */ state) => {
      const { ordered } = state.vocabulary;

      const newOrdered = /** @type {typeof TermSortBy[keyof TermSortBy]} */ (
        ordered + 1 < Object.keys(TermSortBy).length ? ordered + 1 : 0
      );

      const path = "/vocabulary/";
      const attr = "ordered";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr, newOrdered);
    };
  },

  flipVocabularyPracticeSide() {
    return (/** @type {SettingState} */ state) => {
      const path = "/vocabulary/";
      const attr = "practiceSide";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  toggleVocabularyRomaji() {
    return (/** @type {SettingState} */ state) => {
      const path = "/vocabulary/";
      const attr = "romaji";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  toggleVocabularyBareKanji() {
    return (/** @type {SettingState}*/ state) => {
      const path = "/vocabulary/";
      const attr = "bareKanji";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  toggleVocabularyHint() {
    return (/** @type {SettingState}*/ state) => {
      const path = "/vocabulary/";
      const attr = "hintEnabled";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  /**
   * Toggle between groups, frequency, and tags
   * @param {typeof TermFilterBy[keyof TermFilterBy]} [override]
   */
  toggleVocabularyFilter(override) {
    const max = Object.values(TermFilterBy).length - 1;
    const allowed = /** @type {number[]} */ ([
      TermFilterBy.FREQUENCY,
      TermFilterBy.GROUP,
    ]);

    return (/** @type {SettingState} */ state) => {
      const { filter, reinforce } = state.vocabulary;

      const path = "/vocabulary/";
      const attr = "filter";
      const time = new Date();

      /** @type {typeof TermFilterBy[keyof TermFilterBy]}*/
      let newFilter = filter + 1;
      if (override !== undefined) {
        newFilter = override;
      } else {
        while (!allowed.includes(newFilter) || newFilter > max) {
          newFilter = newFilter + 1 > max ? 0 : newFilter + 1;
        }
      }

      localStoreAttrUpdate(time, state, path, attr, newFilter);

      if (newFilter !== 0 && reinforce) {
        vocabularySettings.toggleVocabularyReinforcement(false)(state);
      }

      return newFilter;
    };
  },

  /**
   * @param {string} uid
   */
  addFrequencyWord(uid) {
    return (/** @type {SettingState} */ state) => {
      return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, {
        set: { rein: true },
      })(state);
    };
  },

  /**
   * Removes frequency word
   * @param {string} uid
   */
  removeFrequencyWord(uid) {
    return (/** @type {SettingState} */ state) => {
      const path = "/vocabulary/";
      const attr = "repetition";

      const spaceRep = getLastStateValue(state, path, attr);

      if (spaceRep[uid]?.rein === true) {
        // update frequency list count
        const reinforceList = Object.keys(spaceRep).filter(
          (k) => spaceRep[k].rein === true
        );
        // null to delete
        const { value } = updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, {
          set: { rein: null },
        })(state);

        return { uid, count: reinforceList.length - 1, value };
      }
      return {};
    };
  },

  /**
   * @param {string} uid
   * @param {boolean} [shouldIncrement]
   */
  updateSpaceRepWord(uid, shouldIncrement = true) {
    return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, shouldIncrement);
  },

  /**
   * Sets term timed play average stats (incorrect)
   * @param {string} uid
   * @param {{pronunciation?: true}} options incorrect types
   */
  setWordTPIncorrect(uid, { pronunciation } = {}) {
    return (/** @type {SettingState} */ state) => {
      const pathPart = "vocabulary";

      const path = "/" + pathPart + "/";
      const attr = "repetition";
      const time = new Date();

      const spaceRep = getLastStateValue(state, path, attr);
      const prevMap = { [uid]: spaceRep[uid] };

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
      localStoreAttrUpdate(time, state, path, attr, newValue);

      return { map: { [uid]: o }, prevMap, newValue };
    };
  },

  /**
   * @param {string} uid
   * @param {number} value
   */
  setWordDifficulty(uid, value) {
    return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, {
      set: { difficulty: value },
    });
  },

  /**
   * Sets term timed play average stats (correct)
   * @param {string} uid
   * @param {number} tpElapsed
   * @param {{pronunciation?: null}} options reset incorrect types
   */
  setWordTPCorrect(uid, tpElapsed, { pronunciation } = {}) {
    return (/** @type {SettingState} */ state) => {
      const pathPart = "vocabulary";

      const path = "/" + pathPart + "/";
      const attr = "repetition";
      const time = new Date();

      const spaceRep = getLastStateValue(state, path, attr);
      const prevMap = { [uid]: spaceRep[uid] };

      let newPlayCount = 1;
      let newAccuracy = 1.0;
      let newCorrAvg = tpElapsed;

      if (spaceRep[uid]) {
        const playCount = spaceRep[uid].tpPc;
        const accuracy = spaceRep[uid].tpAcc;
        const correctAvg = spaceRep[uid].tpCAvg || "0";

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
      localStoreAttrUpdate(time, state, path, attr, newValue);

      return { map: { [uid]: o }, prevMap, newValue };
    };
  },

  /**
   * @param {boolean} prevVal
   */
  toggleAutoVerbView(prevVal) {
    return (/** @type {SettingState} */ state) => {
      const path = "/vocabulary/";
      const attr = "autoVerbView";
      const time = new Date();
      localStoreAttrUpdate(time, state, path, attr, !prevVal);

      return !prevVal;
    };
  },

  /**
   * @param {string[]} order
   */
  setVerbFormsOrder(order) {
    return (/** @type {SettingState} */ state) => {
      const path = "/vocabulary/";
      const attr = "verbFormsOrder";
      const time = new Date();
      localStoreAttrUpdate(time, state, path, attr, order);

      return order;
    };
  },

  /**
   * @param {number} split
   */
  updateVerbColSplit(split) {
    return (/** @type {SettingState} */ state) => {
      const path = "/vocabulary/";
      const attr = "verbColSplit";
      const time = new Date();
      localStoreAttrUpdate(time, state, path, attr, split);

      return split;
    };
  },
};

export const initialState = {
  value: /** @type {RawVocabulary[]} */ ([]),
  grpObj: {},
  verbForm: "dictionary",
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
  },

  extraReducers: (builder) => {
    builder.addCase(getVocabulary.fulfilled, (state, action) => {
      state.grpObj = buildGroupObject(action.payload);
      state.value = buildVocabularyObject(action.payload);
    });
  },
});

export const { verbFormChanged } = vocabularySlice.actions;
export default vocabularySlice.reducer;
