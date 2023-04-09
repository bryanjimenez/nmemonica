import { createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { localStorageKey } from "../constants/paths";
import { getVerbFormsArray } from "../helper/gameHelper";
import { getLocalStorageSettings } from "./localStorageHelper";
import { ADD_SPACE_REP_WORD, DebugLevel, toggleDebugAct, updateSpaceRepTerm } from "./settingHelper";
import { SERVICE_WORKER_LOGGER_MSG } from "../actions/serviceWorkerAct";

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

const settingSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
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
        const getState = () => ({ settings: state });
        const override = action.payload;
        state.global.debug = toggleDebugAct(override)(getState);
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
      // FIXME: hacky
      const getState = () => ({ settings: state });
      const { value } = updateSpaceRepTerm(
        ADD_SPACE_REP_WORD,
        action.payload,
        false,
        { toggle: ["f"] }
      )(getState);

      state.vocabulary.repetition = value;
    },

  },
});

export const { localStorageSettingsInitialized, debugToggled, logger, furiganaToggled } =
  settingSlice.actions;
export default settingSlice.reducer;
