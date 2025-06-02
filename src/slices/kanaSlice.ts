import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import { KanaType } from "./settingHelper";
import data from "../../data/json/kana.json";
import { userSettingAttrUpdate } from "../helper/userSettingsHelper";
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

export const kanaSettingsFromAppStorage = createAsyncThunk(
  "kana/kanaSettingsFromAppStorage",
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

      void userSettingAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "charSet",
        newCharSet
      );

      state.setting.charSet = newCharSet;
    },
    setKanaBtnN(state, action: PayloadAction<number>) {
      const number = action.payload;
      void userSettingAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "choiceN",
        number
      );

      state.setting.choiceN = number;
    },
    toggleKanaEasyMode(state) {
      void userSettingAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "easyMode"
      );

      state.setting.easyMode = !state.setting.easyMode;
    },
    toggleKanaGameWideMode(state) {
      void userSettingAttrUpdate(
        new Date(),
        { kana: state.setting },
        "/kana/",
        "wideMode"
      );

      state.setting.wideMode = !state.setting.wideMode;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(kanaSettingsFromAppStorage.fulfilled, (state, action) => {
      const storedValue = action.payload;
      const mergedSettings = merge(kanaInitState.setting, storedValue);

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
