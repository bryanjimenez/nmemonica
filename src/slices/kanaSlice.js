import { createSlice } from "@reduxjs/toolkit";
import data from "../../data/kana.json";
import { localStoreAttrUpdate } from "./localStorageHelper";

export const kanaSettings = {
  toggleKana() {
    return (/** @type {SettingState} */ state) => {
      const { charSet } = state.kana;
      const newCharSet = charSet + 1 < 3 ? charSet + 1 : 0;

      const path = "/kana/";
      const attr = "charSet";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr, newCharSet);
    };
  },

  /**
   * @param {number} number
   */
  setKanaBtnN(number) {
    return (/** @type {SettingState} */ state) => {
      const path = "/kana/";
      const attr = "choiceN";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr, number);
    };
  },

  toggleKanaEasyMode() {
    return (/** @type {SettingState} */ state) => {
      const path = "/kana/";
      const attr = "easyMode";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },

  toggleKanaGameWideMode() {
    return (/** @type {SettingState} */ state) => {
      const path = "/kana/";
      const attr = "wideMode";
      const time = new Date();
      return localStoreAttrUpdate(time, state, path, attr);
    };
  },
};

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
