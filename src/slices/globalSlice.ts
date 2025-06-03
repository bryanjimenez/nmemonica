import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import { type EnglishVoiceType, type JapaneseVoiceType } from "./audioSlice";
import { kanaSettingsFromAppStorage } from "./kanaSlice";
import { kanjiSettingsFromAppStorage } from "./kanjiSlice";
import { oppositeSettingsFromAppStorage } from "./oppositeSlice";
import { particleSettingsFromAppStorage } from "./particleSlice";
import { phraseSettingsFromAppStorage } from "./phraseSlice";
import { DebugLevel, toggleAFilter } from "./settingHelper";
import { memoryStorageStatus, persistStorage } from "./storageHelper";
import { vocabularySettingsFromAppStorage } from "./vocabularySlice";
import { type ConsoleMessage } from "../components/Form/Console";
import { squashSeqMsgs } from "../helper/consoleHelper";
import { allowedCookies } from "../helper/cookieHelper";
import { SWMsgIncoming, UIMsg } from "../helper/serviceWorkerHelper";
import {
  getUserSettings,
  userSettingAttrUpdate,
} from "../helper/userSettingsHelper";
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
  lastImport: string[];
  encryptKey?: string;

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
  lastImport: [],

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

export const appSettingsInitialized = createAsyncThunk(
  "setting/appSettingsInitialized",
  (arg, thunkAPI) => {
    let mergedGlobalSettings = getGlobalInitState();
    return getUserSettings()
      .then((appSettings) => {
        if (appSettings !== null) {
          void thunkAPI.dispatch(
            oppositeSettingsFromAppStorage(appSettings.opposite)
          );
          void thunkAPI.dispatch(
            phraseSettingsFromAppStorage(appSettings.phrases)
          );
          void thunkAPI.dispatch(
            kanjiSettingsFromAppStorage(appSettings.kanji)
          );
          void thunkAPI.dispatch(kanaSettingsFromAppStorage(appSettings.kana));
          void thunkAPI.dispatch(
            particleSettingsFromAppStorage(appSettings.particle)
          );
          void thunkAPI.dispatch(
            vocabularySettingsFromAppStorage(appSettings.vocabulary)
          );

          const globalInitStateAndCookies = getGlobalInitState();
          // use merge to prevent losing defaults not found in App Storage
          mergedGlobalSettings = merge(globalInitStateAndCookies, {
            ...appSettings.global,
          });

          // Batch update localstate settings
          // setTimeout(()=>{
          //   const now = new Date('2023-07-25T001:21:00.000Z');
          //   void thunkAPI.dispatch(logger("Batch update ...", DebugLevel.ERROR));
          //   const done = renameVocabularyLastView(lsSettings, now);
          //   // const done = flipVocabularyDifficulty(lsSettings);
          //   void thunkAPI.dispatch(logger("modified: "+done, DebugLevel.ERROR));
          // }, 15000);
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
      const time = new Date();
      void userSettingAttrUpdate(
        time,
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
      const time = new Date();
      void userSettingAttrUpdate(time, { global: state }, path, attr, override);

      state.swipeThreshold = override;
    },
    setMotionThreshold(state, action: { payload: number }) {
      let override = action.payload;

      const path = "/global/";
      const attr = "motionThreshold";
      const time = new Date();
      void userSettingAttrUpdate(time, { global: state }, path, attr, override);

      state.motionThreshold = override;
    },
    setJapaneseVoice(state, action: { payload: JapaneseVoiceType }) {
      let override = action.payload;

      const path = "/global/";
      const attr = "japaneseVoice";
      const time = new Date();
      void userSettingAttrUpdate(time, { global: state }, path, attr, override);

      state.japaneseVoice = override;
    },
    setEnglishVoice(state, action: { payload: EnglishVoiceType }) {
      let override = action.payload;

      const path = "/global/";
      const attr = "englishVoice";
      const time = new Date();
      void userSettingAttrUpdate(time, { global: state }, path, attr, override);

      state.englishVoice = override;
    },

    debugToggled: {
      reducer: (
        state,
        action: PayloadAction<ValuesOf<typeof DebugLevel> | undefined>
      ) => {
        const override = action.payload;
        const newDebug: number = toggleAFilter(
          state.debug + 1,
          Object.values(DebugLevel),
          override
        );

        void userSettingAttrUpdate(
          new Date(),
          { global: state },
          "/global/",
          "debug",
          newDebug
        );

        state.debug = newDebug;
      },

      prepare: (override: ValuesOf<typeof DebugLevel>) => ({
        payload: override,
      }),
    },

    logger: {
      reducer: (state, action: PayloadAction<ConsoleMessage>) => {
        const { debug } = state;
        const { msg, lvl, type } = action.payload;
        if (debug !== 0 && lvl <= debug) {
          let m;
          if (type === SWMsgIncoming.SERVICE_WORKER_LOGGER_MSG) {
            m = `SW: ${msg}`;
          } else {
            m = `UI: ${msg}`;
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
        lvl: number = DebugLevel.DEBUG,
        type: string = UIMsg.UI_LOGGER_MSG
      ) => ({
        payload: { msg, lvl, type },
      }),
    },
    setEncryptKey(state, action: PayloadAction<string | undefined>) {
      state.encryptKey = action.payload;
    },
    setLastImport(state, action: PayloadAction<string>) {
      const value = action.payload;

      const path = "/global/";
      const attr = "lastImport";
      const time = new Date();

      void getUserSettings().then((storage) => {
        let lastImport: string[] = [value];
        if (storage?.global.lastImport) {
          lastImport = [...storage.global.lastImport, value];
        }

        // no more than 3 import events
        if (lastImport.length > 3) {
          lastImport = lastImport.slice(lastImport.length - 3);
        }

        void userSettingAttrUpdate(
          time,
          { global: state },
          path,
          attr,
          lastImport
        );

        state.lastImport = lastImport;
      });
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
  setLastImport,
  setJapaneseVoice,
  setEnglishVoice,

  debugToggled,
  logger,
  setEncryptKey,
} = globalSlice.actions;
export default globalSlice.reducer;
