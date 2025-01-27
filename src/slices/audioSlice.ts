import { GetThunkAPI, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { type ValuesOf } from "../typings/utils";
import { AUDIO_WORKER_EN_NAME, AUDIO_WORKER_JA_NAME } from "../workers";
import { EnVoiceWorkerQuery } from "../workers/voiceWorker-en";
import {
  type JaVoiceWorkerQuery,
  VoiceWorkerResponse,
} from "../workers/voiceWorker-ja";

import { RootState } from ".";

// global worker variable
let workerJa: Worker | null = null;
let workerEn: Worker | null = null;
let initialized = false;

export type JapaneseVoiceType = "default" | ValuesOf<typeof VOICE_KIND_JA>;
export type EnglishVoiceType = "default" | ValuesOf<typeof VOICE_KIND_EN>;
export const VOICE_KIND_JA = Object.freeze({
  HAPPY: "happy",
  ANGRY: "angry",
  SAD: "sad",
  DEEP: "deep",
});

export const VOICE_KIND_EN = Object.freeze({
  HUMAN_FEMALE: "HumanFemale",
  ROBOT_MALE: "RobotMale",
});

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

export type AudioItemParams = {
  uid: string;
  index?: number;
  tl: "en" | "ja";
  q: string;
};

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
  do {
    // eslint-disable-next-line no-await-in-loop
    const res = await getFromVoiceSynth(
      { uid: key, index, tl, q },
      thunkAPI
    ).then(({ uid: resUid, index, blob }) =>
      blob.arrayBuffer().then((buffer) => ({ uid: resUid, index, buffer }))
    );
    resUid = res.uid;
    resBuffer = res.buffer;
    resIndex = res.index;
  } while (resUid !== key);

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

  let w = { ja: workerJa, en: workerEn }[tl];
  return new Promise<GetSynthAudioResult>(async (resolve, reject) => {
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
      const err = `Failed to load worker voice-${tl}`;
      reject(new Error(err));
      return;
    }

    const aWorker = w;

    const wMsgHandler = (event: MessageEvent<VoiceWorkerResponse | Error>) => {
      if (event.data instanceof Error) {
        reject(event.data);
        return;
      }
      const audio = event.data.buffer;

      const blob = new Blob([audio.buffer], {
        type: "audio/wav",
      });

      initialized = true;
      resolve({ uid: event.data.uid, index: event.data.index, blob });
    };

    w.addEventListener("message", wMsgHandler, { once: true });

    const message: JaVoiceWorkerQuery | EnVoiceWorkerQuery = {
      uid,
      index,
      tl,
      q,
      englishVoice: tl === "en" ? englishVoice : undefined,
      japaneseVoice: tl === "ja" ? japaneseVoice : undefined,
    };

    if (initialized === true) {
      aWorker.postMessage(message);
    } else {
      let tries = 0;
      while (tries < 10 && initialized === false) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
        if (initialized === false) {
          w.postMessage(message);
        }

        tries++;
      }

      if (initialized === false) {
        const err = `Could not initialize @nmemonica/voice-${tl} (${tries} tries)`;
        reject(new Error(err));
      }
    }
  });
}

const voiceSlice = createSlice({
  name: "voice",
  initialState: {},

  reducers: {},
});

export const {} = voiceSlice.actions;
export default voiceSlice.reducer;
