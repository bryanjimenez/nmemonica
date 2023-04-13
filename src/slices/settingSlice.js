import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { localStorageKey } from "../constants/paths";
import { getVerbFormsArray } from "../helper/gameHelper";
import {
  getLocalStorageSettings,
  localStoreAttrUpdate,
} from "./localStorageHelper";
import {
  DebugLevel,
  toggleActiveGrpHelper,
  toggleActiveTagHelper,
  toggleDebugHelper,
} from "./settingHelper";
import { SERVICE_WORKER_LOGGER_MSG } from "./serviceWorkerSlice";
import { memoryStorageStatus, persistStorage } from "./storageHelper";
import { vocabularySettings } from "./vocabularySlice";
import { phraseSettings } from "./phraseSlice";
import { kanjiSettings } from "./kanjiSlice";

/**
 * @typedef {typeof import("../slices/settingHelper").TermSortBy} TermSortBy
 * @typedef {typeof import("../slices/settingHelper").TermFilterBy} TermFilterBy
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
  async (arg, thunkAPI) => {
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
  async (arg, thunkAPI) => {
    return persistStorage().catch((e) => {
      thunkAPI.dispatch(
        logger("Could not set persistent storage", DebugLevel.WARN)
      );
      thunkAPI.dispatch(logger(e.message, DebugLevel.WARN));
      throw e;
    });
  }
);

export const updateSpaceRepWord = createAsyncThunk(
  "setting/updateSpaceRepWord",
  async (arg, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = thunkAPI.getState().settingsHK;

    return vocabularySettings.updateSpaceRepWord(uid, shouldIncrement)(state);
  }
);

export const updateSpaceRepPhrase = createAsyncThunk(
  "setting/updateSpaceRepPhrase",
  async (arg, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = thunkAPI.getState().settingsHK;

    return phraseSettings.updateSpaceRepPhrase(uid, shouldIncrement)(state);
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
    localStorageSettingsInitialized() {
      const lsSettings = getLocalStorageSettings(localStorageKey);
      // use merge to prevent losing defaults not found in localStorage
      const mergedSettings = merge(initialState, lsSettings);
      delete mergedSettings.lastModified;

      // calculated values
      const vocabReinforceList = Object.keys(
        mergedSettings.vocabulary.repetition
      ).filter((k) => mergedSettings.vocabulary.repetition[k]?.rein === true);
      mergedSettings.vocabulary.frequency = {
        uid: undefined,
        count: vocabReinforceList.length,
      };

      const phraseReinforceList = Object.keys(
        mergedSettings.phrases.repetition
      ).filter((k) => mergedSettings.phrases.repetition[k]?.rein === true);
      mergedSettings.phrases.frequency = {
        uid: undefined,
        count: phraseReinforceList.length,
      };

      const kanjiReinforceList = Object.keys(
        mergedSettings.kanji.repetition
      ).filter((k) => mergedSettings.kanji.repetition[k]?.rein === true);
      mergedSettings.kanji.frequency = {
        uid: undefined,
        count: kanjiReinforceList.length,
      };

      // mergedSettings is a multi-level deep object
      return {
        ...mergedSettings,
      };
    },

    debugToggled: {
      reducer: (
        state,
        /** @type {import("@reduxjs/toolkit").PayloadAction<typeof DebugLevel[keyof DebugLevel]>} */ action
      ) => {
        const override = action.payload;
        state.global.debug = toggleDebugHelper(override)(state);
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
    toggleActiveGrp: {
      reducer: (state, action) => {
        const { parent, grpName } = action.payload;

        state[parent].activeGroup = toggleActiveGrpHelper(
          parent,
          grpName
        )(state);
      },
      prepare: (parent, grpName) => ({ payload: { parent, grpName } }),
    },
    toggleActiveTag: {
      reducer: (state, action) => {
        const { parent, tagName } = action.payload;

        state[parent].activeTags = toggleActiveTagHelper(
          parent,
          tagName
        )(state);
      },
      prepare: (parent, tagName) => ({ payload: { parent, tagName } }),
    },

    // Vocabulary Settings
    furiganaToggled(state, action) {
      state.vocabulary.repetition = vocabularySettings.toggleFurigana(
        action.payload
      )(state);
    },

    toggleVocabularyReinforcement(state) {
      state.vocabulary.reinforce =
        vocabularySettings.toggleVocabularyReinforcement()(state);
    },

    toggleVocabularyOrdering(state) {
      state.vocabulary.ordered =
        vocabularySettings.toggleVocabularyOrdering()(state);
    },

    flipVocabularyPracticeSide(state) {
      state.vocabulary.practiceSide =
        vocabularySettings.flipVocabularyPracticeSide()(state);
    },

    toggleVocabularyRomaji(state) {
      state.vocabulary.romaji =
        vocabularySettings.toggleVocabularyRomaji()(state);
    },

    toggleVocabularyBareKanji(state) {
      state.vocabulary.bareKanji =
        vocabularySettings.toggleVocabularyBareKanji()(state);
    },

    toggleVocabularyHint(state) {
      state.vocabulary.hintEnabled =
        vocabularySettings.toggleVocabularyHint()(state);
    },

    toggleVocabularyFilter(state) {
      state.vocabulary.filter = vocabularySettings.toggleVocabularyFilter(
        state.vocabulary.filter
      )(state);
    },

    setVerbFormsOrder(state, action) {
      state.vocabulary.verbFormsOrder = vocabularySettings.setVerbFormsOrder(
        action.payload
      )(state);
    },

    toggleAutoVerbView(state) {
      state.vocabulary.autoVerbView = vocabularySettings.toggleAutoVerbView(
        state.vocabulary.autoVerbView
      )(state);
    },

    updateVerbColSplit(state, action) {
      state.vocabulary.verbColSplit = vocabularySettings.updateVerbColSplit(
        action.payload
      )(state);
    },

    addFrequencyWord(state, action) {
      const { value } = vocabularySettings.addFrequencyWord(action.payload)(
        state
      );

      state.vocabulary.repetition = value;
      state.vocabulary.frequency.uid = action.payload;
      state.vocabulary.frequency.count = state.vocabulary.frequency.count + 1;
    },

    removeFrequencyWord(state, action) {
      const { value } = vocabularySettings.removeFrequencyWord(action.payload)(
        state
      );

      if (value) {
        state.vocabulary.repetition = value;
      }

      state.vocabulary.frequency.uid = action.payload;
      state.vocabulary.frequency.count = state.vocabulary.frequency.count - 1;
    },

    setWordDifficulty: {
      reducer: (state, action) => {
        const { uid, value } = action.payload;
        const { value: newValue } = vocabularySettings.setWordDifficulty(
          uid,
          value
        )(state);

        state.vocabulary.repetition = newValue;
      },
      prepare: (uid, value) => ({ payload: { uid, value } }),
    },
    setWordTPCorrect: {
      reducer: (state, action) => {
        const { uid, tpElapsed, pronunciation } = action.payload;
        const { newValue } = vocabularySettings.setWordTPCorrect(
          uid,
          tpElapsed,
          { pronunciation }
        )(state);

        state.vocabulary.repetition = newValue;
      },
      prepare: (uid, tpElapsed, { pronunciation } = {}) => ({
        payload: { uid, tpElapsed, pronunciation },
      }),
    },
    setWordTPIncorrect: {
      reducer: (state, action) => {
        const { uid, pronunciation } = action.payload;
        const { newValue } = vocabularySettings.setWordTPIncorrect(uid, {
          pronunciation,
        })(state);

        state.vocabulary.repetition = newValue;
      },
      prepare: (uid, { pronunciation } = {}) => ({
        payload: { uid, pronunciation },
      }),
    },

    // Phrases Settings
    flipPhrasesPracticeSide(state) {
      const side = phraseSettings.flipPhrasesPracticeSide()(state);

      state.phrases.practiceSide = side;
    },
    togglePhrasesRomaji(state) {
      state.phrases.romaji = phraseSettings.togglePhrasesRomaji()(state);
    },
    togglePhrasesOrdering(state) {
      state.phrases.ordered = phraseSettings.togglePhrasesOrdering()(state);
    },
    togglePhrasesFilter(state) {
      state.phrases.filter = phraseSettings.togglePhrasesFilter()(state);
    },
    togglePhrasesReinforcement(state) {
      state.phrases.reinforce =
        phraseSettings.togglePhrasesReinforcement()(state);
    },
    addFrequencyPhrase(state, action) {
      const uid = action.payload;
      const { value } = phraseSettings.addFrequencyPhrase(uid)(state);

      state.phrases.repetition = value;
      state.phrases.frequency.uid = action.payload;
      state.phrases.frequency.count = state.phrases.frequency.count + 1;
    },

    removeFrequencyPhrase(state, action) {
      const { value } = phraseSettings.removeFrequencyPhrase(action.payload)(
        state
      );

      if (value) {
        state.phrases.repetition = value;
      }

      state.phrases.frequency.uid = action.payload;
      state.phrases.frequency.count = state.phrases.frequency.count - 1;
    },

    // Kanji Settings
    addFrequencyKanji(state, action) {
      const uid = action.payload;
      const { value } = kanjiSettings.addFrequencyKanji(uid)(state);

      state.kanji.repetition = value;
      state.kanji.frequency.uid = action.payload;
      state.kanji.frequency.count = state.kanji.frequency.count + 1;
    },
    removeFrequencyKanji(state, action) {
      const uid = action.payload;

      const { value, count } = kanjiSettings.removeFrequencyKanji(uid)(state);

      if (value) {
        state.kanji.repetition = value;
      }

      state.kanji.frequency.uid = uid;
      state.kanji.frequency.count = count;
    },
    setKanjiBtnN(state, action) {
      const number = action.payload;
      state.kanji.choiceN = kanjiSettings.setKanjiBtnN(number)(state);
    },
    toggleKanjiFilter(state, action) {
      const override = action.payload;
      state.kanji.filter = kanjiSettings.toggleKanjiFilter(override)(state);
    },
    toggleKanjiReinforcement(state) {
      state.kanji.reinforce = kanjiSettings.toggleKanjiReinforcement()(state);
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

    builder.addCase(updateSpaceRepWord.fulfilled, (state, action) => {
      const { value } = action.payload;
      state.vocabulary.repetition = value;
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
  removeFrequencyWord,
  setVerbFormsOrder,
  toggleVocabularyOrdering,
  toggleActiveGrp,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  toggleVocabularyHint,
  toggleVocabularyReinforcement,
  toggleVocabularyRomaji,
  updateVerbColSplit,
  toggleVocabularyBareKanji,
  flipVocabularyPracticeSide,
  addFrequencyWord,

  setWordDifficulty,
  setWordTPCorrect,
  setWordTPIncorrect,

  flipPhrasesPracticeSide,
  togglePhrasesRomaji,
  togglePhrasesFilter,
  togglePhrasesReinforcement,
  addFrequencyPhrase,
  removeFrequencyPhrase,
  togglePhrasesOrdering,

  addFrequencyKanji,
  removeFrequencyKanji,
  setHiraganaBtnN,
  setKanjiBtnN,
  setParticlesARomaji,
  toggleActiveTag,
  toggleKana,
  toggleKanaEasyMode,
  toggleKanaGameWideMode,
  toggleKanjiFilter,
  toggleKanjiReinforcement,
} = settingSlice.actions;
export default settingSlice.reducer;
