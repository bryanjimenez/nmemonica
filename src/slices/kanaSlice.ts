import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import { updateUserSettings } from "./indexedDBSlice";
import { KanaType } from "./settingHelper";
import data from "../../res/json/kana.json";
import type { RootState } from "../typings/slices";
import type { ValuesOf } from "../typings/utils";

const SLICE_NAME = "kana";
const path = "/kana/";

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
  `${SLICE_NAME}/kanaSettingsFromAppStorage`,
  (arg: typeof kanaInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

export const toggleKana = createAsyncThunk(
  `${SLICE_NAME}/toggleKana`,
  (_arg, thunkAPI) => {
    const attr = "charSet";
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { charSet } = setting;
    const newCharSet = (
      charSet + 1 < Object.keys(KanaType).length
        ? charSet + 1
        : KanaType.HIRAGANA
    ) as ValuesOf<typeof KanaType>;

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { kana: setting },
          path,
          attr,
          value: newCharSet,
        })
      )
      .unwrap();
  }
);

export const setKanaBtnN = createAsyncThunk(
  `${SLICE_NAME}/setKanaBtnN`,
  (override: number, thunkAPI) => {
    const attr = "choiceN";
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { kana: setting },
          path,
          attr,
          value: override,
        })
      )
      .unwrap();
  }
);

export const toggleKanaEasyMode = createAsyncThunk(
  `${SLICE_NAME}/toggleKanaEasyMode`,
  (_arg, thunkAPI) => {
    const attr = "easyMode";
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings<boolean>({
          state: { kana: setting },
          path,
          attr,
        })
      )
      .unwrap();
  }
);

export const toggleKanaGameWideMode = createAsyncThunk(
  `${SLICE_NAME}/toggleKanaGameWideMode`,
  (_arg, thunkAPI) => {
    const attr = "wideMode";
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings<boolean>({
          state: { kana: setting },
          path,
          attr,
        })
      )
      .unwrap();
  }
);

const kanaSlice = createSlice({
  name: SLICE_NAME,
  initialState: kanaInitState,

  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(kanaSettingsFromAppStorage.fulfilled, (state, action) => {
      const storedValue = action.payload;
      const mergedSettings = merge(kanaInitState.setting, storedValue);

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });

    builder.addCase(toggleKana.fulfilled, (state, action) => {
      const newCharSet = action.payload;
      state.setting.charSet = newCharSet;
    });

    builder.addCase(setKanaBtnN.fulfilled, (state, action) => {
      const choiceN = action.payload;
      state.setting.choiceN = choiceN;
    });

    builder.addCase(toggleKanaEasyMode.fulfilled, (state, action) => {
      const easyMode = action.payload;
      state.setting.easyMode = easyMode;
    });

    builder.addCase(toggleKanaGameWideMode.fulfilled, (state, action) => {
      const wideMode = action.payload;
      state.setting.wideMode = wideMode;
    });
  },
});

export default kanaSlice.reducer;
