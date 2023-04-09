import { createSlice } from "@reduxjs/toolkit";
import data from "../../data/kana.json";

const initialState = {
  hiragana: /** @type {string[][]}*/ ([]),
  katakana: /** @type {string[][]}*/ ([]),
  vowels: /** @type {string[]}*/ ([]),
  consonants: /** @type {string[]}*/ ([]),
  sounds: /** @type {{[uid:string]:string}}*/ ({}),
};

const kanaSlice = createSlice({
  name: "kana",
  initialState,

  reducers: {
    getKana(state) {
      return {
        ...state,
        hiragana: data.hiragana,
        katakana: data.katakana,
        vowels: data.vowels,
        consonants: data.consonants,
        sounds: data.sounds,
      };
    },
  },
});

export const { getKana } = kanaSlice.actions;
export default kanaSlice.reducer;
