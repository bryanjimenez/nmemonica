import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import { buildTagObject } from "../helper/reducerHelper";

/**
 * @typedef {import("../typings/raw").RawKanji} RawKanji
 */

/**
 * Fetch vocabulary
 */
export const getKanji = createAsyncThunk(
  "kanji/getKanji",
  async (v, thunkAPI) => {
    const state = thunkAPI.getState();
    const version = state.version.kanji || 0;

    console.warn("getKanji " + JSON.stringify({ version: state.version }));
    return fetch(firebaseConfig.databaseURL + "/lambda/kanji.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

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
