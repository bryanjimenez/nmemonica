import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import { kanaSettingsFromAppStorage } from "./kanaSlice";
import { kanjiSettingsFromAppStorage } from "./kanjiSlice";
import { oppositeSettingsFromAppStorage } from "./oppositeSlice";
import { particleSettingsFromAppStorage } from "./particleSlice";
import { phraseSettingsFromAppStorage } from "./phraseSlice";
import { toggleAFilter } from "./settingHelper";
import { memoryStorageStatus, persistStorage } from "./storageHelper";
import { vocabularySettingsFromAppStorage } from "./vocabularySlice";
import type {
  EnglishVoiceType,
  JapaneseVoiceType,
} from "../constants/voiceConstants";
import {
  type ConsoleMessage,
  DebugLevel,
  squashSeqMsgs,
} from "../helper/consoleHelper";
import { allowedCookies } from "../helper/cookieHelper";
import {
  getUserSettings,
  localStorageKey,
  userSettingAttrUpdate,
} from "../helper/userSettingsHelper";
import { getLocalStorageUserSettings } from "../helper/userSettingsLocalStorageHelper";
import type { ValuesOf } from "../typings/utils";

export interface MemoryDataObject {
  quota: number;
  usage: number;
  persistent: boolean;
  warning?: string;
}

export interface GlobalInitSlice {
  cookies: boolean;
  cookieRefresh: number;
  darkMode: boolean;
  memory: MemoryDataObject;
  debug: number;
  console: ConsoleMessage[];
  swipeThreshold: number;
  motionThreshold: number;

  japaneseVoice: JapaneseVoiceType;
  englishVoice: EnglishVoiceType;
}

export const globalInitState: GlobalInitSlice = {
  cookies: allowedCookies(),
  cookieRefresh: -1,
  darkMode: false,
  memory: { quota: 0, usage: 0, persistent: false },
  debug: DebugLevel.OFF,
  console: [],
  swipeThreshold: 0,
  motionThreshold: 0,

  japaneseVoice: "default",
  englishVoice: "default",
};

/**
 * Gets current cookie state + initial global state
 */
function getGlobalInitState() {
  const cookies = allowedCookies();

  return { ...globalInitState, cookies };
}

export const getMemoryStorageStatus = createAsyncThunk(
  "setting/getMemoryStorageStatus",
  async (arg, thunkAPI) => {
    return memoryStorageStatus().catch((e) => {
      if (e instanceof Error) {
        thunkAPI.dispatch(
          logger("Could not get memory storage status", DebugLevel.WARN)
        );

        thunkAPI.dispatch(logger(e.message, DebugLevel.WARN));
        throw e;
      }
    });
  }
);

export const setPersistentStorage = createAsyncThunk(
  "setting/setPersistentStorage",
  async (arg, thunkAPI) => {
    return persistStorage()
      .then((resInfo) => {
        const { warning } = resInfo;
        if (typeof warning === "string") {
          thunkAPI.dispatch(logger(warning, DebugLevel.WARN));
        }

        return resInfo;
      })
      .catch((e) => {
        if (e instanceof Error) {
          thunkAPI.dispatch(
            logger("Could not set persistent storage", DebugLevel.WARN)
          );
          thunkAPI.dispatch(logger(e.message, DebugLevel.WARN));
          throw e;
        }
      });
  }
);

/**
 * Load anything saved on localStorage (Faster)
 * All global settings duplicated on localStorage for added speedy initial load advantage
 */
export const appSettingsInitializedLocalStorage = createAsyncThunk(
  "setting/appSettingsInitializedLocalStorage",
  (_arg, _thunkAPI) => {
    let globalInitStateAndCookies = getGlobalInitState();
    let tempSettings = globalInitStateAndCookies;
    const appSettings = getLocalStorageUserSettings(localStorageKey);

    if (appSettings !== null) {
      // use merge to prevent losing defaults not found in App Storage
      tempSettings = merge(globalInitStateAndCookies, {
        ...appSettings.global,
      });
    }

    return tempSettings;
  }
);

export const appSettingsInitialized = createAsyncThunk(
  "setting/appSettingsInitialized",
  (_arg, thunkAPI) => {
    let mergedGlobalSettings = getGlobalInitState();
    return getUserSettings()
      .then((appSettings) => {
        if (appSettings.opposite !== undefined) {
          void thunkAPI.dispatch(
            oppositeSettingsFromAppStorage(appSettings.opposite)
          );
        }
        if (appSettings.phrases !== undefined) {
          void thunkAPI.dispatch(
            phraseSettingsFromAppStorage(appSettings.phrases)
          );
        }
        if (appSettings.kanji !== undefined) {
          void thunkAPI.dispatch(
            kanjiSettingsFromAppStorage(appSettings.kanji)
          );
        }
        if (appSettings.kana !== undefined) {
          void thunkAPI.dispatch(kanaSettingsFromAppStorage(appSettings.kana));
        }
        if (appSettings.particle !== undefined) {
          void thunkAPI.dispatch(
            particleSettingsFromAppStorage(appSettings.particle)
          );
        }
        if (appSettings.vocabulary !== undefined) {
          void thunkAPI.dispatch(
            vocabularySettingsFromAppStorage(appSettings.vocabulary)
          );
        }

        const globalInitStateAndCookies = getGlobalInitState();
        if (appSettings.global !== undefined) {
          // use merge to prevent losing defaults not found in App Storage
          mergedGlobalSettings = merge(globalInitStateAndCookies, {
            ...appSettings.global,
          });
        }

        return mergedGlobalSettings;
      })
      .catch(() => {
        const errMsg = "Storage not supported";
        void thunkAPI.dispatch(logger(errMsg));
        throw new Error(errMsg);
      });
  }
);

const globalSlice = createSlice({
  name: "setting",
  initialState: globalInitState,
  reducers: {
    toggleCookies(state, action: PayloadAction<boolean>) {
      if (action.payload !== undefined) {
        state.cookies = action.payload;
      } else {
        state.cookies = !state.cookies;
      }
      state.cookieRefresh = Date.now();
    },
    toggleDarkMode(state) {
      const path = "/global/";
      const attr = "darkMode";

      void userSettingAttrUpdate(
        { global: state },
        path,
        attr,
        !state.darkMode
      );
      state.darkMode = !state.darkMode;
    },
    setSwipeThreshold(state, action: PayloadAction<number>) {
      let override = action.payload;

      const path = "/global/";
      const attr = "swipeThreshold";

      void userSettingAttrUpdate({ global: state }, path, attr, override);

      state.swipeThreshold = override;
    },
    setMotionThreshold(state, action: { payload: number }) {
      let override = action.payload;

      const path = "/global/";
      const attr = "motionThreshold";

      void userSettingAttrUpdate({ global: state }, path, attr, override);

      state.motionThreshold = override;
    },
    setJapaneseVoice(state, action: { payload: JapaneseVoiceType }) {
      let override = action.payload;

      const path = "/global/";
      const attr = "japaneseVoice";

      void userSettingAttrUpdate({ global: state }, path, attr, override);

      state.japaneseVoice = override;
    },
    setEnglishVoice(state, action: { payload: EnglishVoiceType }) {
      let override = action.payload;

      const path = "/global/";
      const attr = "englishVoice";

      void userSettingAttrUpdate({ global: state }, path, attr, override);

      state.englishVoice = override;
    },

    debugToggled: {
      reducer: (
        state,
        action: PayloadAction<ValuesOf<typeof DebugLevel> | undefined>
      ) => {
        const path = "/global/";
        const attr = "debug";

        const override = action.payload;
        const newDebug: number = toggleAFilter(
          state.debug + 1,
          Object.values(DebugLevel),
          override
        );

        void userSettingAttrUpdate({ global: state }, path, attr, newDebug);

        state.debug = newDebug;
      },

      prepare: (override: ValuesOf<typeof DebugLevel>) => ({
        payload: override,
      }),
    },

    logger: {
      reducer: (state, action: PayloadAction<ConsoleMessage>) => {
        const { debug } = state;
        const { msg, lvl, origin: type } = action.payload;
        if (debug !== 0 && lvl <= debug) {
          let m;
          if (type === undefined) {
            m = `UI: ${msg}`;
          } else {
            m = `${type}: ${msg}`;
          }

          const begining = state.console.slice(0, -1);
          const lastOne = state.console.slice(-1);
          const incoming = { msg: m, lvl, time: Date.now() };

          /** one to two messages */
          const squashed = squashSeqMsgs([...lastOne, incoming]);

          // Only keep a fixed number of lines
          if (begining.length > 100) {
            const maxed = begining.slice(-100);
            state.console = [...maxed, ...squashed];
          } else {
            state.console = [...begining, ...squashed];
          }
        }
      },

      prepare: (
        msg: string,
        lvl: ConsoleMessage["lvl"] = DebugLevel.DEBUG,
        type?: ConsoleMessage["origin"]
      ) => ({
        payload: { msg, lvl, origin: type },
      }),
    },
  },

  extraReducers: (builder) => {
    builder.addCase(appSettingsInitialized.fulfilled, (state, action) => {
      const mergedSettings = action.payload;
      // mergedSettings is a multi-level deep object
      return {
        ...mergedSettings,
      };
    });

    builder.addCase(
      appSettingsInitializedLocalStorage.fulfilled,
      (state, action) => {
        const mergedSettings = action.payload;
        // mergedSettings is a multi-level deep object
        return {
          ...mergedSettings,
        };
      }
    );

    builder.addCase(getMemoryStorageStatus.fulfilled, (state, action) => {
      const { quota, usage, persistent } =
        action.payload as GlobalInitSlice["memory"];

      state.memory = { quota, usage, persistent };
    });

    builder.addCase(setPersistentStorage.fulfilled, (state, action) => {
      const { quota, usage, persistent } =
        action.payload as GlobalInitSlice["memory"];

      state.memory = { quota, usage, persistent };
    });
  },
});

export const {
  toggleCookies,
  toggleDarkMode,
  setMotionThreshold,
  setSwipeThreshold,
  setJapaneseVoice,
  setEnglishVoice,

  debugToggled,
  logger,
} = globalSlice.actions;
export default globalSlice.reducer;
