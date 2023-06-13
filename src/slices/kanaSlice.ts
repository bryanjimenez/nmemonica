import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import data from "../../data/kana.json";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import { KanaType } from "./settingHelper";

export interface KanaInitSlice {
  hiragana: string[][];
  katakana: string[][];
  vowels: string[];
  consonants: string[];
  sounds: typeof data.sounds;

  setting: {
    choiceN: number;
    wideMode: boolean;
    easyMode: boolean;
    charSet: (typeof KanaType)[keyof typeof KanaType];
  };
}

const kanaInitState: KanaInitSlice = {
  hiragana: data.hiragana,
  katakana: data.katakana,
  vowels: data.vowels,
  consonants: data.consonants,
  sounds: data.sounds,

  setting: {
    choiceN: 16,
    wideMode: false,
    easyMode: false,
    charSet: 0,
  },
};

export const kanaFromLocalStorage = createAsyncThunk(
  "kana/kanaFromLocalStorage",
  async (arg: typeof kanaInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

const kanaSlice = createSlice({
  name: "kana",
  initialState: kanaInitState,

  reducers: {
    toggleKana(state) {
      const { charSet } = state.setting;
      const newCharSet = (
        charSet + 1 < Object.keys(KanaType).length
          ? charSet + 1
          : KanaType.HIRAGANA
      ) as (typeof KanaType)[keyof typeof KanaType];

      state.setting.charSet = localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "charSet",
        newCharSet
      );
    },
    setKanaBtnN(state, action) {
      const number: number = action.payload;
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
      const mergedSettings = merge(kanaInitState.setting, localStorageValue);

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
