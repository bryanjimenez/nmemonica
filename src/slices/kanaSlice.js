import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import data from "../../data/kana.json";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";

export const kanaFromLocalStorage = createAsyncThunk(
  "kana/kanaFromLocalStorage",
  async (arg) => {
    const initValues = arg;

    return initValues;
  }
);

const initialState = {
  hiragana: /** @type {string[][]}*/ ([]),
  katakana: /** @type {string[][]}*/ ([]),
  vowels: /** @type {string[]}*/ ([]),
  consonants: /** @type {string[]}*/ ([]),
  sounds: /** @type {{[uid:string]:string}}*/ ({}),

  setting: {
    choiceN: 16,
    wideMode: false,
    easyMode: false,
    charSet: 0,
  },
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
    toggleKana(state) {
      const { charSet } = state.setting;
      const newCharSet = charSet + 1 < 3 ? charSet + 1 : 0;

      state.setting.charSet = localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "charSet",
        newCharSet
      );
    },
    setKanaBtnN(state, action) {
      const number = action.payload;
      state.setting.choiceN = localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "choiceN",
        number
      );
    },
    toggleKanaEasyMode(state) {
      state.setting.easyMode = localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "easyMode"
      );
    },
    toggleKanaGameWideMode(state) {
      state.setting.wideMode = localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "wideMode"
      );
    },
  },
  extraReducers: (builder) => {
    builder.addCase(kanaFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(initialState.setting, localStorageValue);

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });
  },
});

export const {
  getKana,
  toggleKana,
  setKanaBtnN,
  toggleKanaEasyMode,
  toggleKanaGameWideMode,
} = kanaSlice.actions;
export default kanaSlice.reducer;
