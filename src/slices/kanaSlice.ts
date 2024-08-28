import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import { KanaType } from "./settingHelper";
import data from "../../data/json/kana.json";
import { localStoreAttrUpdate } from "../helper/settingsStorageHelper";
import type { ValuesOf } from "../typings/utils";

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
    charSet: ValuesOf<typeof KanaType>;
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
  (arg: typeof kanaInitState.setting) => {
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
      ) as ValuesOf<typeof KanaType>;

      void localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "charSet",
        newCharSet
      ).then((charSet) => {
        state.setting.charSet = charSet;
      });
    },
    setKanaBtnN(state, action: PayloadAction<number>) {
      const number = action.payload;
      void localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "choiceN",
        number
      ).then((choiceN) => {
        state.setting.choiceN = choiceN;
      });
    },
    toggleKanaEasyMode(state) {
      void localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "easyMode"
      ).then((easyMode) => {
        state.setting.easyMode = easyMode;
      });
    },
    toggleKanaGameWideMode(state) {
      void localStoreAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "wideMode"
      ).then((wideMode) => {
        state.setting.wideMode = wideMode;
      });
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
