import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import { kanaFromLocalStorage } from "./kanaSlice";
import { kanjiFromLocalStorage } from "./kanjiSlice";
import { oppositeFromLocalStorage } from "./oppositeSlice";
import { particleFromLocalStorage } from "./particleSlice";
import { phraseFromLocalStorage } from "./phraseSlice";
import { DebugLevel, toggleAFilter } from "./settingHelper";
import { memoryStorageStatus, persistStorage } from "./storageHelper";
import { VersionInitSlice } from "./versionSlice";
import { vocabularyFromLocalStorage } from "./vocabularySlice";
import { dataServicePath } from "../../environment.development";
import { dataServiceEndpoint } from "../../environment.production";
import {
  IDBKeys,
  IDBStores,
  openIDB,
  putIDBItem,
} from "../../pwa/helper/idbHelper";
import { type ConsoleMessage } from "../components/Form/Console";
import {
  ExternalSourceType,
  getExternalSourceType,
} from "../components/Form/ExtSourceInput";
import { localStorageKey } from "../constants/paths";
import { squashSeqMsgs } from "../helper/consoleHelper";
import {
  getLocalStorageSettings,
  localStoreAttrUpdate,
} from "../helper/localStorageHelper";
import {
  SWMsgIncoming,
  SWRequestHeader,
  UIMsg,
} from "../helper/serviceWorkerHelper";
import type { ValuesOf } from "../typings/raw";

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
  localServiceURL: string;
  lastImport: string[];
}

export const globalInitState: GlobalInitSlice = {
  darkMode: false,
  memory: { quota: 0, usage: 0, persistent: false },
  debug: 0,
  console: [],
  swipeThreshold: 0,
  motionThreshold: 0,
  localServiceURL: "",
  lastImport: [],
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
    return persistStorage()
      .then((resInfo) => {
        const { warning } = resInfo;
        if (warning) {
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

export const localStorageSettingsInitialized = createAsyncThunk(
  "setting/localStorageSettingsInitialized",
  (arg, thunkAPI) => {
    let lsSettings = null;
    let mergedGlobalSettings = globalInitState;

    try {
      lsSettings = getLocalStorageSettings(localStorageKey);
    } catch (e) {
      void thunkAPI.dispatch(logger("localStorage not supported"));
    }

    if (lsSettings !== null) {
      void thunkAPI.dispatch(oppositeFromLocalStorage(lsSettings.opposite));
      void thunkAPI.dispatch(phraseFromLocalStorage(lsSettings.phrases));
      void thunkAPI.dispatch(kanjiFromLocalStorage(lsSettings.kanji));
      void thunkAPI.dispatch(kanaFromLocalStorage(lsSettings.kana));
      void thunkAPI.dispatch(particleFromLocalStorage(lsSettings.particle));
      void thunkAPI.dispatch(vocabularyFromLocalStorage(lsSettings.vocabulary));

      // use merge to prevent losing defaults not found in localStorage
      mergedGlobalSettings = merge(globalInitState, {
        ...lsSettings.global,
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
  }
);

export const setLocalServiceURL = createAsyncThunk(
  "setting/setLocalServiceURL",
  async (arg: string) => {
    const localServiceURL = arg;

    let url: string;
    const externalSource = getExternalSourceType(localServiceURL);
    switch (externalSource) {
      case ExternalSourceType.GitHubUserContent:
        url = localServiceURL;
        break;

      case ExternalSourceType.LocalService:
        url = localServiceURL + dataServicePath;
        break;

      default:
        url = dataServiceEndpoint;
        break;
    }

    if (externalSource === ExternalSourceType.GitHubUserContent) {
      // verify is available
      // is not cached
      return fetch(url + "/Vocabulary.csv").then((res) => {
        if (!res.ok) {
          throw new Error("Could not verify repo");
        }
        return { versions: {} as VersionInitSlice, localServiceURL: url };
      });
    }

    // TODO: do service handshake verif
    return fetch(url + "/cache.json", {
      headers: { [SWRequestHeader.NO_CACHE]: "ServiceWorkerNoCache" },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Local Service not responding");
        }

        return res.json();
      })
      .then((versions: VersionInitSlice) => ({ versions, localServiceURL }));
  }
);

/**
 * After user edits or imports a dataset
 * - mark cached data as edited or untouched
 */
export const setLocalDataEdited = createAsyncThunk(
  "setting/setLocalDataEdited",
  async (arg: boolean) => {
    const override = arg;

    return openIDB().then((db) =>
      putIDBItem(
        { db, store: IDBStores.STATE },
        { key: IDBKeys.State.EDITED, value: override }
      )
    );
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
        action: PayloadAction<ValuesOf<typeof DebugLevel> | undefined>
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
    setLastImport(state, action: PayloadAction<string>) {
      const value = action.payload;

      const path = "/global/";
      const attr = "lastImport";
      const time = new Date();

      const storage = getLocalStorageSettings(localStorageKey);
      let lastImport: string[] = [value];
      if (storage?.global.lastImport) {
        lastImport = [...storage.global.lastImport, value];
      }

      // no more than 3 import events
      if (lastImport.length > 3) {
        lastImport = lastImport.slice(lastImport.length - 3);
      }

      state.lastImport = localStoreAttrUpdate(
        time,
        { global: state },
        path,
        attr,
        lastImport
      );
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
      const { quota, usage, persistent } =
        action.payload as GlobalInitSlice["memory"];

      state.memory = { quota, usage, persistent };
    });
    builder.addCase(setLocalServiceURL.rejected, (state) => {
      const path = "/global/";
      const attr = "localServiceURL";
      const time = new Date();
      state.localServiceURL = localStoreAttrUpdate(
        time,
        { global: state },
        path,
        attr,
        ""
      );
    }),
      builder.addCase(setLocalServiceURL.fulfilled, (state, action) => {
        const overrideUrl = action.payload.localServiceURL;
        const path = "/global/";
        const attr = "localServiceURL";
        const time = new Date();
        state.localServiceURL = localStoreAttrUpdate(
          time,
          { global: state },
          path,
          attr,
          overrideUrl
        );
      });
  },
});

export const {
  toggleDarkMode,
  setMotionThreshold,
  setSwipeThreshold,
  setLastImport,

  debugToggled,
  logger,
} = globalSlice.actions;
export default globalSlice.reducer;
