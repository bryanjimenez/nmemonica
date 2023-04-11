import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { localStorageKey } from "../constants/paths";
import { getVerbFormsArray } from "../helper/gameHelper";
import {
  getLocalStorageSettings,
  localStoreAttrUpdate,
} from "./localStorageHelper";
import { DebugLevel, toggleDebugAct } from "./settingHelper";
import { SERVICE_WORKER_LOGGER_MSG } from "./serviceWorkerSlice";
import { memoryStorageStatus, persistStorage } from "./storageHelper";
import { vocabularySettings } from "./vocabularySlice";

/**
 * @typedef {typeof import("../actions/settingsAct").TermSortBy} TermSortBy
 * @typedef {typeof import("../actions/settingsAct").TermFilterBy} TermFilterBy
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */
/**
 * @typedef {{msg:string, lvl:number, type:string}} Msg
 */

export const UI_LOGGER_MSG = "ui_logger_msg";

export const initialState = {
  global: {
    darkMode: false,
    scrolling: false,
    memory: { quota: 0, usage: 0, persistent: false },
    debug: 0,
    console: /** @type {{msg:string, lvl:number}[]}*/ ([]),
    swipeThreshold: 0,
    motionThreshold: 0,
  },
  kana: { choiceN: 16, wideMode: false, easyMode: false, charSet: 0 },
  phrases: {
    ordered: /** @type {TermSortBy[keyof TermSortBy]} */ (0),
    practiceSide: false,
    romaji: false,
    reinforce: false,
    repetition: /** @type {SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (0),
  },
  vocabulary: {
    ordered: /** @type {TermSortBy[keyof TermSortBy]} */ (0),
    practiceSide: false,
    romaji: false,
    bareKanji: false,
    hintEnabled: false,
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (0),
    reinforce: false,
    repetition: /** @type {SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    autoVerbView: false,
    verbColSplit: 0,
    verbFormsOrder: getVerbFormsArray().map((f) => f.name),
  },
  kanji: {
    choiceN: 32,
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (2),
    reinforce: false,
    repetition: /** @type {SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    activeTags: [],
  },
  opposites: { qRomaji: false, aRomaji: false },
  particles: { aRomaji: false },
};

export const getMemoryStorageStatus = createAsyncThunk(
  "setting/getMemoryStorageStatus",
  async (v, thunkAPI) => {
    return memoryStorageStatus().catch((e) => {
      thunkAPI.dispatch(
        logger("Could not get memory storage status", DebugLevel.WARN)
      );

      thunkAPI.dispatch(logger(e.message, DebugLevel.WARN));
      throw e;
    });
  }
);

export const setPersistentStorage = createAsyncThunk(
  "setting/setPersistentStorage",
  async (v, thunkAPI) => {
    return persistStorage().catch((e) => {
      thunkAPI.dispatch(
        logger("Could not set persistent storage", DebugLevel.WARN)
      );
      thunkAPI.dispatch(logger(e.message, DebugLevel.WARN));
      throw e;
    });
  }
);

const settingSlice = createSlice({
  name: "setting",
  initialState,
  reducers: {
    toggleDarkMode(state) {
      const path = "/global/";
      const attr = "darkMode";
      const time = new Date();
      localStoreAttrUpdate(time, state, path, attr, !state.global.darkMode);
      state.global.darkMode = !state.global.darkMode;
    },
    scrollingState(state, action) {
      state.global.scrolling = action.payload;
    },
    setSwipeThreshold(state, action) {
      const path = "/global/";
      const attr = "swipeThreshold";
      const time = new Date();
      localStoreAttrUpdate(time, state, path, attr, action.payload);
      state.global.swipeThreshold = action.payload;
    },
    setMotionThreshold(state, action) {
      const path = "/global/";
      const attr = "motionThreshold";
      const time = new Date();
      localStoreAttrUpdate(time, state, path, attr, action.payload);
      state.global.motionThreshold = action.payload;
    },
    localStorageSettingsInitialized(state) {
      const lsSettings = getLocalStorageSettings(localStorageKey);
      // use merge to prevent losing defaults not found in localStorage

      const mergedSettings = merge(initialState, lsSettings);
      delete mergedSettings.lastModified;
      state.vocabulary = mergedSettings.vocabulary;

      // calculated values
      const vocabReinforceList = Object.keys(
        mergedSettings.vocabulary.repetition
      ).filter((k) => mergedSettings.vocabulary.repetition[k]?.rein === true);
      state.vocabulary.frequency = {
        uid: undefined,
        count: vocabReinforceList.length,
      };

      const phraseReinforceList = Object.keys(
        mergedSettings.phrases.repetition
      ).filter((k) => mergedSettings.phrases.repetition[k]?.rein === true);
      state.phrases.frequency = {
        uid: undefined,
        count: phraseReinforceList.length,
      };

      const kanjiReinforceList = Object.keys(
        mergedSettings.kanji.repetition
      ).filter((k) => mergedSettings.kanji.repetition[k]?.rein === true);
      state.kanji.frequency = {
        uid: undefined,
        count: kanjiReinforceList.length,
      };
    },

    debugToggled: {
      reducer: (
        state,
        /** @type {import("@reduxjs/toolkit").PayloadAction<typeof DebugLevel[keyof DebugLevel]>} */ action
      ) => {
        const override = action.payload;
        state.global.debug = toggleDebugAct(override)(state);
      },

      prepare: (override) => ({
        payload: override,
      }),
    },

    logger: {
      reducer: (
        state,
        /** @type {import("@reduxjs/toolkit").PayloadAction<Msg>} */ action
      ) => {
        const { debug } = state.global;
        const { msg, lvl, type } = action.payload;
        if (debug !== 0 && lvl <= debug) {
          let m;
          if (type === SERVICE_WORKER_LOGGER_MSG) {
            m = "SW: " + msg;
          } else {
            m = "UI: " + msg;
          }
          state.global.console = [...state.global.console, { msg: m, lvl }];
        }
      },

      prepare: (msg, lvl = DebugLevel.DEBUG, type = UI_LOGGER_MSG) => ({
        payload: { msg, lvl, type },
      }),
    },

    furiganaToggled(state, action) {
      state.vocabulary.repetition = vocabularySettings.toggleFurigana(
        action.payload
      )(state);
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getMemoryStorageStatus.fulfilled, (state, action) => {
      const { quota, usage, persistent } = action.payload;

      state.global.memory = { quota, usage, persistent };
    });

    builder.addCase(setPersistentStorage.fulfilled, (state, action) => {
      const { quota, usage, persistent, warning } = action.payload;

      if (warning) {
        console.warn(warning);
      }

      state.global.memory = { quota, usage, persistent };
    });
  },
});

export const {
  toggleDarkMode,
  setMotionThreshold,
  setSwipeThreshold,
  scrollingState,

  debugToggled,
  logger,
  localStorageSettingsInitialized,

  furiganaToggled,
} = settingSlice.actions;
export default settingSlice.reducer;
