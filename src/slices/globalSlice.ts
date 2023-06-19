import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { localStorageKey } from "../constants/paths";
import {
  getLocalStorageSettings,
  localStoreAttrUpdate,
} from "../helper/localStorageHelper";
import { DebugLevel, toggleAFilter } from "./settingHelper";
import { memoryStorageStatus, persistStorage } from "./storageHelper";
import { phraseFromLocalStorage } from "./phraseSlice";
import { kanjiFromLocalStorage } from "./kanjiSlice";
import { kanaFromLocalStorage } from "./kanaSlice";
import { oppositeFromLocalStorage } from "./oppositeSlice";
import { particleFromLocalStorage } from "./particleSlice";
import { vocabularyFromLocalStorage } from "./vocabularySlice";
import { SERVICE_WORKER_LOGGER_MSG } from "../constants/actionNames";
import type { ConsoleMessage } from "../components/Form/Console";

export interface MemoryDataObject {
  quota: number;
  usage: number;
  persistent: boolean;
  warning?: string;
}

export interface GlobalInitSlice {
  darkMode: boolean;
  memory: MemoryDataObject;
  debug: number;
  console: ConsoleMessage[];
  swipeThreshold: number;
  motionThreshold: number;
}
export const UI_LOGGER_MSG = "ui_logger_msg";

export const globalInitState: GlobalInitSlice = {
  darkMode: false,
  memory: { quota: 0, usage: 0, persistent: false },
  debug: 0,
  console: [],
  swipeThreshold: 0,
  motionThreshold: 0,
};

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
    return persistStorage().catch((e) => {
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

export const localStorageSettingsInitialized = createAsyncThunk(
  "setting/localStorageSettingsInitialized",
  async (arg, thunkAPI) => {
    let lsSettings = null;
    let mergedGlobalSettings = globalInitState;

    try {
      lsSettings = getLocalStorageSettings(localStorageKey);
    } catch (e) {
      thunkAPI.dispatch(logger("localStorage not supported"));
    }

    if (lsSettings !== null) {
      thunkAPI.dispatch(oppositeFromLocalStorage(lsSettings.opposite));
      thunkAPI.dispatch(phraseFromLocalStorage(lsSettings.phrases));
      thunkAPI.dispatch(kanjiFromLocalStorage(lsSettings.kanji));
      thunkAPI.dispatch(kanaFromLocalStorage(lsSettings.kana));
      thunkAPI.dispatch(particleFromLocalStorage(lsSettings.particle));
      thunkAPI.dispatch(vocabularyFromLocalStorage(lsSettings.vocabulary));

      // use merge to prevent losing defaults not found in localStorage
      mergedGlobalSettings = merge(globalInitState, {
        ...lsSettings.global,
      });
    }

    return mergedGlobalSettings;
  }
);

const globalSlice = createSlice({
  name: "setting",
  initialState: globalInitState,
  reducers: {
    toggleDarkMode(state) {
      const path = "/global/";
      const attr = "darkMode";
      const time = new Date();
      localStoreAttrUpdate(
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
      state.swipeThreshold = localStoreAttrUpdate(
        time,
        { global: state },
        path,
        attr,
        override
      );
    },
    setMotionThreshold(state, action: { payload: number }) {
      let override = action.payload;

      const path = "/global/";
      const attr = "motionThreshold";
      const time = new Date();
      state.motionThreshold = localStoreAttrUpdate(
        time,
        { global: state },
        path,
        attr,
        override
      );
    },

    debugToggled: {
      reducer: (
        state,
        action: PayloadAction<(typeof DebugLevel)[keyof typeof DebugLevel]>
      ) => {
        const override = action.payload;
        const newDebug: number = toggleAFilter(
          state.debug + 1,
          Object.values(DebugLevel),
          override
        );

        state.debug = localStoreAttrUpdate(
          new Date(),
          { global: state },
          "/global/",
          "debug",
          newDebug
        );
      },

      prepare: (override: (typeof DebugLevel)[keyof typeof DebugLevel]) => ({
        payload: override,
      }),
    },

    logger: {
      reducer: (state, action: PayloadAction<ConsoleMessage>) => {
        const { debug } = state;
        const { msg, lvl, type } = action.payload;
        if (debug !== 0 && lvl <= debug) {
          let m;
          if (type === SERVICE_WORKER_LOGGER_MSG) {
            m = `SW: ${msg}`;
          } else {
            m = `UI: ${msg}`;
          }
          state.console = [...state.console, { msg: m, lvl }];
        }
      },

      prepare: (
        msg: string,
        lvl: number = DebugLevel.DEBUG,
        type: string = UI_LOGGER_MSG
      ) => ({
        payload: { msg, lvl, type },
      }),
    },
  },

  extraReducers: (builder) => {
    builder.addCase(
      localStorageSettingsInitialized.fulfilled,
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
      const { quota, usage, persistent, warning } =
        action.payload as GlobalInitSlice["memory"];

      if (warning) {
        console.warn(warning);
      }

      state.memory = { quota, usage, persistent };
    });
  },
});

export const {
  toggleDarkMode,
  setMotionThreshold,
  setSwipeThreshold,

  debugToggled,
  logger,
} = globalSlice.actions;
export default globalSlice.reducer;
