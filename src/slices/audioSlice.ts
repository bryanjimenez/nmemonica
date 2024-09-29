import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { logger } from "./globalSlice";
import { DebugLevel } from "./settingHelper";
import {
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
  putIDBItem,
} from "../../pwa/helper/idbHelper";
import { SWRequestHeader, hasHeader } from "../helper/serviceWorkerHelper";
import { getParam } from "../helper/urlHelper";
import { type ValuesOf } from "../typings/utils";
import { type VoiceWorkerMsgParam } from "../worker/voiceWorker";

import { AppDispatch, RootState } from ".";

// global worker variable
let worker: Worker | null = null;
let initialized = false;

export type JapaneseVoiceType = "default" | ValuesOf<typeof VOICE_KIND>;
export const VOICE_KIND = Object.freeze({
  HAPPY: "happy",
  ANGRY: "angry",
  SAD: "sad",
  DEEP: "deep",
});

export const initAudioWorker = createAsyncThunk(
  "voice/initAudioWorker",
  (_arg, _thunkAPI) => {
    if (worker === null) {
      worker = new Worker("./voice-worker.js");
    }
  }
);

export const dropAudioWorker = createAsyncThunk(
  "voice/dropAudioWorker",
  (_arg, _thunkAPI) => {
    if (worker !== null) {
      worker.terminate();
    }
  }
);

export const getAudio = createAsyncThunk(
  "voice/getAudio",
  async (arg: Request, thunkAPI) => {
    const { japaneseVoice } = (thunkAPI.getState() as RootState).global;
    const dispatch = thunkAPI.dispatch as AppDispatch;
    const req = arg;

    const override_cache = hasHeader(req, SWRequestHeader.CACHE_RELOAD);

    const uid = getParam(req.url, "uid");
    if (uid === null) {
      throw new Error("Expected an UID");
    }

    return override_cache
      ? getFromVoiceSynth(req, japaneseVoice)
      : getFromIndexedDB(uid, dispatch).catch(() =>
          getFromVoiceSynth(req, japaneseVoice)
        );
  }
);

function getFromVoiceSynth(
  audioUrl: Request,
  japaneseVoice: JapaneseVoiceType
) {
  return new Promise<Blob>(async (resolve, reject) => {
    if (worker === null) {
      worker = new Worker("./voice-worker.js");
    }

    const removeHandler = () => {
      worker?.removeEventListener("message", workerHandler);
    };
    const workerHandler = (event: MessageEvent<Uint8Array | undefined>) => {
      if (event.data === undefined) {
        reject(new Error("Could not synthesize query"));
        return;
      }
      const audio = event.data;
      const uid = getParam(audioUrl.url, "uid");
      if (uid === null) {
        throw new Error("Expected an UID");
      }

      const blob = new Blob([audio.buffer], {
        type: "audio/wav",
      });

      void openIDB().then((db) =>
        putIDBItem(
          { db, store: IDBStores.MEDIA },
          {
            uid,
            blob,
          }
        )
      );

      initialized = true;
      removeHandler();

      resolve(blob);
    };

    worker.addEventListener("message", workerHandler);

    const message: VoiceWorkerMsgParam = {
      audioUrl: { url: audioUrl.url },
      japaneseVoice,
    };

    if (initialized === true) {
      worker.postMessage(message);
    } else {
      let tries = 0;
      while (tries < 10 && initialized === false) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
        if (initialized === false) {
          worker.postMessage(message);
        }

        tries++;
      }

      if (initialized === false) {
        reject(new Error("Could not load @nmemonica/voice-ja"));
      }
    }
  });
}

function getFromIndexedDB(uid: string, dispatch: AppDispatch) {
  return openIDB().then((db) => {
    // if indexedDB has stored setttings
    const stores = Array.from(db.objectStoreNames);

    const ErrorMediaCacheMissing = new Error("No cached media available", {
      cause: { code: IDBErrorCause.NoResult },
    });
    if (!stores.includes(IDBStores.MEDIA)) {
      throw ErrorMediaCacheMissing;
    }

    return getIDBItem({ db, store: IDBStores.MEDIA }, uid)
      .then((dataO) => dataO.blob)
      .catch(() => {
        dispatch(logger("IDB.get [] ", DebugLevel.WARN));

        throw new Error("Media not found in cache");
      });
  });
}

const voiceSlice = createSlice({
  name: "voice",
  initialState: {},

  reducers: {},
});

export const {} = voiceSlice.actions;
export default voiceSlice.reducer;
