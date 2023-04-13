import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import { buildTagObject } from "../helper/reducerHelper";
import {
  ADD_SPACE_REP_KANJI,
  TermFilterBy,
  getLastStateValue,
  updateSpaceRepTerm,
} from "./settingHelper";
import { localStoreAttrUpdate } from "./localStorageHelper";

/**
 * @typedef {import("../typings/raw").RawKanji} RawKanji
 */

/**
 * Fetch vocabulary
 */
export const getKanji = createAsyncThunk(
  "kanji/getKanji",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState();
    const version = state.version.kanji || 0;

    if (version === 0) {
      console.error("fetching kanji: 0");
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/kanji.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

export const kanjiSettings = {
  /**
   * @param {string} uid
   */
  addFrequencyKanji(uid) {
    return (/** @type {SettingState} */ state) =>
      updateSpaceRepTerm(ADD_SPACE_REP_KANJI, uid, false, {
        set: { rein: true },
      })(state);
  },
  /**
   * Removes frequency word
   * @param {string} uid
   */
  removeFrequencyKanji(uid) {
    return (/** @type {SettingState} */ state) => {
      const path = "/kanji/";
      const attr = "repetition";
      /** @type {SpaceRepetitionMap} */
      const spaceRep = getLastStateValue(state, path, attr);

      if (spaceRep[uid]?.rein === true) {
        // update frequency list count
        const reinforceList = Object.keys(spaceRep).filter(
          (k) => spaceRep[k].rein === true
        );
        // null to delete
        const { value } = updateSpaceRepTerm(ADD_SPACE_REP_KANJI, uid, false, {
          set: { rein: null },
        })(state);

        return { uid, count: reinforceList.length - 1, value };
      }
    };
  },

  /**
   * @param {number} number
   */
  setKanjiBtnN(number) {
    return (/** @type {SettingState} */ state) => {
      const path = "/kanji/";
      const attr = "choiceN";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr, number);
    };
  },

  /**
   * Toggle between frequency and tags
   * @param {typeof TermFilterBy[keyof TermFilterBy]} [override]
   */
  toggleKanjiFilter(override) {
    return (/** @type {SettingState} */ state) => {
      const { filter, reinforce } = state.kanji;

      const path = "/kanji/";
      const attr = "filter";
      const time = new Date();

      let newFilter;
      if (override !== undefined) {
        newFilter = override;
      } else {
        newFilter = Object.values(TermFilterBy).includes(filter + 1)
          ? filter + 1
          : /*skip TermFilterBy.GROUP*/ TermFilterBy.FREQUENCY;
      }

      localStoreAttrUpdate(time, state, path, attr, newFilter);

      if (newFilter !== 0 && reinforce) {
        kanjiSettings.toggleKanjiReinforcement()(state);
      }

      return newFilter;
    };
  },

  toggleKanjiReinforcement() {
    return (state) => {
      const path = "/kanji/";
      const attr = "reinforce";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },
};

export const initialState = {
  value: /** @type {RawKanji[]} */ ([]),
  tagObj: /** @type {string[]} */ ([]),
};

const kanjiSlice = createSlice({
  name: "kanji",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(getKanji.fulfilled, (state, action) => {
      const value = Object.keys(action.payload).map((k) => ({
        ...action.payload[k],
        uid: k,
        tag: action.payload[k].tag === undefined ? [] : action.payload[k].tag,
      }));

      state.tagObj = buildTagObject(action.payload);
      state.value = value;
    });
  },
});

export default kanjiSlice.reducer;
