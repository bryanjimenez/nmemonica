import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import data from "../../data/kana.json";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import { KanaType } from "./settingHelper";

export const kanaFromLocalStorage = createAsyncThunk(
  "kana/kanaFromLocalStorage",
  /** @param {typeof initialState['setting']} arg */
  async (arg) => {
    const initValues = arg;

    return initValues;
  }
);

const initialState = {
  hiragana: data.hiragana,
  katakana: data.katakana,
  vowels: data.vowels,
  consonants: data.consonants,
  sounds: data.sounds,

  setting: {
    choiceN: 16,
    wideMode: false,
    easyMode: false,
    charSet: /** @type {typeof KanaType[keyof KanaType]} */ (0),
  },
};

const kanaSlice = createSlice({
  name: "kana",
  initialState,

  reducers: {
    toggleKana(state) {
      const { charSet } = state.setting;
      const newCharSet = /** @type {typeof KanaType[keyof KanaType]} */ (
        charSet + 1 < Object.keys(KanaType).length
          ? charSet + 1
          : KanaType.HIRAGANA
      );

      state.setting.charSet = localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "charSet",
        newCharSet
      );
    },
    setKanaBtnN(state, action) {
      /** @type {number} */
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
  toggleKana,
  setKanaBtnN,
  toggleKanaEasyMode,
  toggleKanaGameWideMode,
} = kanaSlice.actions;
export default kanaSlice.reducer;
