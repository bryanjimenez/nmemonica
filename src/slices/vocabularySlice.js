import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import {
  buildGroupObject,
  buildVocabularyObject,
} from "../helper/reducerHelper";

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

    console.warn("getVocabulary " + JSON.stringify({ version: state.version }));
    return fetch(firebaseConfig.databaseURL + "/lambda/vocabulary.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

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
