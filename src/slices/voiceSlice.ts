import { GetThunkAPI, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { logger } from "./globalSlice";
import {
  AudioItemParams,
  VoiceErrorCode,
  VoiceWorkerResponse,
} from "../constants/voiceConstants";
import { DebugLevel, msgInnerTrim, secsSince } from "../helper/consoleHelper";
import {
  AUDIO_WORKER_EN_NAME,
  AUDIO_WORKER_JA_NAME,
  VoiceErrorObject,
  exceptionToErrorObj,
  isVoiceErrorObject,
} from "../workers";
import { type EnVoiceWorkerQuery } from "../workers/voiceWorker-en";
import { type JaVoiceWorkerQuery } from "../workers/voiceWorker-ja";

import { AppDispatch, RootState } from ".";

// global worker variable
let workerJa: Worker | null = null;
let workerEn: Worker | null = null;
const workerQueue = {
  ja: new Map<string, { time: number }>(),
  en: new Map<string, { time: number }>(),
};

export function logAudioError(
  dispatch: AppDispatch,
  exception: unknown,
  pronunciation: string,
  caughtOrigin?: string
) {
  const error = exceptionToErrorObj(exception, caughtOrigin);

  const errMsg = error.message.toLowerCase();
  if (
    errMsg.startsWith("@nmemonica") &&
    (errMsg.includes("invalid input") ||
      errMsg.includes("invalid printable ascii"))
  ) {
    const module = error.message.split(" ")[0];
    error.cause = { code: VoiceErrorCode.BAD_INPUT, module };
  }

  let msg: string;
  switch (error.cause?.code) {
    case VoiceErrorCode.MODULE_LOAD_ERROR:
    case VoiceErrorCode.UNREACHABLE:
    case VoiceErrorCode.BAD_INPUT:
    case VoiceErrorCode.DUPLICATE_REQUEST:
    case VoiceErrorCode.MAX_RETRY:
      msg = `${error.cause.code} at ${error.cause.module} with ${msgInnerTrim(pronunciation, 20)}`;
      break;
    default:
      msg = JSON.stringify(exception);
  }

  dispatch(logger(msg, DebugLevel.ERROR));
}

/**
 * Initialize wasm for `@nmemonica/voice-ja`
 */
export const initAudioWorker = createAsyncThunk(
  "voice/initAudioWorker",
  (_arg, _thunkAPI) => {
    if (workerJa === null) {
      workerJa = new Worker(AUDIO_WORKER_JA_NAME);
    }
    if (workerEn === null) {
      workerEn = new Worker(AUDIO_WORKER_EN_NAME);
    }
  }
);

/**
 * Terminate wasm for `@nmemonica/voice-ja`
 */
export const dropAudioWorker = createAsyncThunk(
  "voice/dropAudioWorker",
  (_arg, _thunkAPI) => {
    if (workerJa !== null) {
      workerJa.terminate();
      workerJa = null;
    }
    if (workerEn !== null) {
      workerEn.terminate();
      workerEn = null;
    }
  }
);

// TODO: @nmemonica/voice-ja not async/parallel
// TODO: @nmemonica/voice-en not async/parallel
export const getSynthAudioWorkaroundNoAsync = createAsyncThunk(
  "voice/getSynthAudioWorkaroundNoAsync",
  getSynthAudioWorkaroundNoAsyncFn
);

async function getSynthAudioWorkaroundNoAsyncFn(
  arg: {
    key: AudioItemParams["uid"];
    index: AudioItemParams["index"] | undefined;
    tl: AudioItemParams["tl"];
    q: AudioItemParams["q"];
  },
  thunkAPI: GetThunkAPI<unknown>
) {
  const { key, index, tl, q } = arg;
  let resUid, resIndex, resBuffer;

  const res = await getFromVoiceSynth(
    { uid: key, index, tl, q },
    thunkAPI
  ).then(({ uid: resUid, index, blob }) =>
    blob.arrayBuffer().then((buffer) => ({ uid: resUid, index, buffer }))
  );
  resUid = res.uid;
  resBuffer = res.buffer;
  resIndex = res.index;

  if (resUid !== key) {
    // voiceSynth isn't parallel and can fail
    // when multiple req don't finish
    workerQueue[tl].delete(key);

    const retry = await getFromVoiceSynth(
      { uid: key, index, tl, q },
      thunkAPI
    ).then(({ uid: resUid, index, blob }) =>
      blob.arrayBuffer().then((buffer) => ({ uid: resUid, index, buffer }))
    );
    resUid = retry.uid;
    resBuffer = retry.buffer;
    resIndex = retry.index;
    if (resUid !== key) {
      /* eslint-disable-next-line @typescript-eslint/only-throw-error */
      throw thunkAPI.rejectWithValue(
        JSON.stringify({
          name: "Error",
          message: "Previous failed. Retry failed.",
          cause: {
            code: VoiceErrorCode.MAX_RETRY,
            module: `voice-${tl}`,
          },
        })
      );
    }
  }

  return { uid: resUid, buffer: resBuffer, index: resIndex };
}

type GetSynthAudioResult = { uid: string; index?: number; blob: Blob };
async function getFromVoiceSynth(
  arg: {
    uid: AudioItemParams["uid"];
    index: AudioItemParams["index"] | undefined;
    tl: AudioItemParams["tl"];
    q: AudioItemParams["q"];
  },
  thunkAPI: GetThunkAPI<unknown>
): Promise<GetSynthAudioResult> {
  const { uid, index, tl, q } = arg;
  const { japaneseVoice, englishVoice } = (thunkAPI.getState() as RootState)
    .global;

  const t = workerQueue[tl].get(uid)?.time;
  if (t !== undefined) {
    const seconds = secsSince(t);
    if (seconds < 2) {
      /* eslint-disable-next-line @typescript-eslint/only-throw-error */
      throw thunkAPI.rejectWithValue(
        JSON.stringify({
          name: "Error",
          message: "Request already queued",
          cause: {
            code: VoiceErrorCode.DUPLICATE_REQUEST,
            module: `voice-${tl}`,
          },
        })
      );
    }

    // allow addtl req if prev is too stale
    workerQueue[tl].delete(uid);
  }

  let w = { ja: workerJa, en: workerEn }[tl];
  return new Promise<GetSynthAudioResult>((resolve, reject) => {
    if (w === null) {
      switch (tl) {
        case "ja": {
          workerJa = new Worker(AUDIO_WORKER_JA_NAME);
          w = workerJa;
          break;
        }

        case "en": {
          workerEn = new Worker(AUDIO_WORKER_EN_NAME);
          w = workerEn;
          break;
        }
      }
    }

    if (w === null) {
      /* eslint-disable-next-line @typescript-eslint/only-throw-error */
      throw thunkAPI.rejectWithValue(
        JSON.stringify({
          name: "Error",
          message: `Failed to load worker voice-${tl}`,
          cause: {
            code: VoiceErrorCode.MODULE_LOAD_ERROR,
            module: `voice-${tl}`,
          },
        })
      );
    }

    const aWorker = w;

    const wMsgHandler = (
      event: MessageEvent<VoiceWorkerResponse | VoiceErrorObject>
    ) => {
      if (isVoiceErrorObject(event.data)) {
        reject(event.data);
        return;
      }

      const audio = event.data.buffer;
      workerQueue[tl].delete(event.data.uid);

      const blob = new Blob([audio.buffer], {
        type: "audio/wav",
      });

      // console.log(`resolving ${tl} ${event.data.index} ${event.data.uid}`)
      resolve({ uid: event.data.uid, index: event.data.index, blob });
    };

    const wMsgPost = (msg: JaVoiceWorkerQuery | EnVoiceWorkerQuery) => {
      if (!workerQueue[msg.tl].has(msg.uid)) {
        if (workerQueue[msg.tl].size > 0) {
          // should delete oldest req if we had a pool of workers
          workerQueue[msg.tl].clear();
        }
        // console.log(`fetching ${msg.tl} ${msg.index} ${msg.uid}`)
        workerQueue[msg.tl].set(msg.uid, { time: Date.now() });
        aWorker.postMessage(msg);
      }
    };

    aWorker.addEventListener("message", wMsgHandler, { once: true });

    const message: JaVoiceWorkerQuery | EnVoiceWorkerQuery = {
      uid,
      index,
      tl,
      q,
      englishVoice: tl === "en" ? englishVoice : undefined,
      japaneseVoice: tl === "ja" ? japaneseVoice : undefined,
    };

    wMsgPost(message);
  });
}

export type AudioInitSlice = {
  loading: string[];
};

export const audioInitialState: AudioInitSlice = {
  loading: [],
};

const voiceSlice = createSlice({
  name: "voice",
  initialState: audioInitialState,

  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getSynthAudioWorkaroundNoAsync.pending, (state, action) => {
      const { key: uidPlus } = action.meta.arg;
      state.loading = [...state.loading, uidPlus];
    });
    builder.addCase(
      getSynthAudioWorkaroundNoAsync.fulfilled,
      (state, action) => {
        const { key: uidPlus } = action.meta.arg;
        const updated = state.loading.filter((id) => id !== uidPlus);
        state.loading = updated;
      }
    );
    // builder.addCase(getAudio.rejected, (_state, _action) => {});
  },
});

export const {} = voiceSlice.actions;
export default voiceSlice.reducer;
