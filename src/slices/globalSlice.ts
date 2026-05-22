import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import { getUserSettings, updateUserSettings } from "./indexedDBSlice";
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
import { getLocalStorageUserSettings } from "../helper/userSettingsLocalStorageHelper";
import type { RootState } from "../typings/slices";

const SLICE_NAME = "global";
const path = "/global/";

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
  `${SLICE_NAME}/getMemoryStorageStatus`,
  async (_arg, thunkAPI) => {
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
  `${SLICE_NAME}/setPersistentStorage`,
  async (_arg, thunkAPI) => {
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
  `${SLICE_NAME}/appSettingsInitializedLocalStorage`,
  (_arg, _thunkAPI) => {
    let globalInitStateAndCookies = getGlobalInitState();
    let tempSettings = globalInitStateAndCookies;
    const appSettings = getLocalStorageUserSettings();

    if (appSettings !== null) {
      // use merge to prevent losing defaults not found in App Storage
      tempSettings = merge(globalInitStateAndCookies, {
        ...appSettings.global,
      });
    }

    return tempSettings;
  }
);

export const toggleDarkMode = createAsyncThunk(
  `${SLICE_NAME}/toggleDarkMode`,
  (_arg, thunkAPI) => {
    const attr = "darkMode";
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { global: state },
          path,
          attr,
          value: !state.darkMode,
        })
      )
      .unwrap();
  }
);

export const setSwipeThreshold = createAsyncThunk(
  `${SLICE_NAME}/setSwipeThreshold`,
  (override: number, thunkAPI) => {
    const attr = "swipeThreshold";
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { global: state },
          path,
          attr,
          value: override,
        })
      )
      .unwrap();
  }
);

export const setMotionThreshold = createAsyncThunk(
  `${SLICE_NAME}/setMotionThreshold`,
  (override: number, thunkAPI) => {
    const attr = "motionThreshold";
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { global: state },
          path,
          attr,
          value: override,
        })
      )
      .unwrap();
  }
);

export const setJapaneseVoice = createAsyncThunk(
  `${SLICE_NAME}/setJapaneseVoice`,
  (override: JapaneseVoiceType, thunkAPI) => {
    const attr = "japaneseVoice";
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { global: state },
          path,
          attr,
          value: override,
        })
      )
      .unwrap();
  }
);

export const setEnglishVoice = createAsyncThunk(
  `${SLICE_NAME}/setEnglishVoice`,
  (override: EnglishVoiceType, thunkAPI) => {
    const attr = "englishVoice";
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { global: state },
          path,
          attr,
          value: override,
        })
      )
      .unwrap();
  }
);

export const debugToggled = createAsyncThunk(
  `${SLICE_NAME}/debugToggled`,
  (override: number, thunkAPI) => {
    const attr = "debug";
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const newDebug: number = toggleAFilter(
      state.debug + 1,
      Object.values(DebugLevel),
      override
    );

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { global: state },
          path,
          attr,
          value: newDebug,
        })
      )
      .unwrap();
  }
);

export const appSettingsInitialized = createAsyncThunk(
  `${SLICE_NAME}/appSettingsInitialized`,
  (_arg, thunkAPI) => {
    let mergedGlobalSettings = getGlobalInitState();
    return thunkAPI
      .dispatch(getUserSettings())
      .unwrap()
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
  name: SLICE_NAME,
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

    builder.addCase(toggleDarkMode.fulfilled, (state, action) => {
      const darkMode = action.payload;
      state.darkMode = darkMode;
    });

    builder.addCase(setSwipeThreshold.fulfilled, (state, action) => {
      const swipeThreshold = action.payload;
      state.swipeThreshold = swipeThreshold;
    });

    builder.addCase(setMotionThreshold.fulfilled, (state, action) => {
      const motionThreshold = action.payload;
      state.motionThreshold = motionThreshold;
    });

    builder.addCase(setJapaneseVoice.fulfilled, (state, action) => {
      const japaneseVoice = action.payload;
      state.japaneseVoice = japaneseVoice;
    });

    builder.addCase(setEnglishVoice.fulfilled, (state, action) => {
      const englishVoice = action.payload;
      state.englishVoice = englishVoice;
    });

    builder.addCase(debugToggled.fulfilled, (state, action) => {
      const debug = action.payload;
      state.debug = debug;
    });
  },
});

export const { toggleCookies, logger } = globalSlice.actions;
export type loggerType = typeof logger;
export default globalSlice.reducer;
