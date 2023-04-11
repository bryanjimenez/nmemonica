import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import {
  buildGroupObject,
  buildVocabularyObject,
} from "../helper/reducerHelper";
import { ADD_SPACE_REP_WORD, updateSpaceRepTerm } from "./settingHelper";

/**
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 */

/**
 * Fetch vocabulary
 */
export const getVocabulary = createAsyncThunk(
  "vocabulary/getVocabulary",
  async (v, thunkAPI) => {
    const state = thunkAPI.getState();
    const version = state.version.vocabulary || 0;

    if (version === 0) {
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
