import { buildSpeech as jBuildSpeech } from "@nmemonica/voice-ja";

import voice_model_deep from "../../res/models/hts_voice_nitech_jp_atr503_m001-1.05/nitech_jp_atr503_m001.htsvoice";
import voice_model_angry from "../../res/models/tohoku-f01/tohoku-f01-angry.htsvoice";
import voice_model_happy from "../../res/models/tohoku-f01/tohoku-f01-happy.htsvoice";
import voice_model_neutral from "../../res/models/tohoku-f01/tohoku-f01-neutral.htsvoice";
import voice_model_sad from "../../res/models/tohoku-f01/tohoku-f01-sad.htsvoice";
import { type JapaneseVoiceType } from "../slices/audioSlice";

const wSelf = globalThis.self as unknown as Worker;

export interface JaVoiceWorkerQuery {
  // uid & index to prevent swapping buffers incorrectly
  uid: string;
  index?: number;

  tl: string;
  q: string;
  japaneseVoice?: JapaneseVoiceType;
  AbortController?: AbortController;
}

export interface VoiceWorkerResponse {
  uid: string;
  index?: number;

  buffer: Uint8Array;
}

let voice: { name?: JapaneseVoiceType; buffer?: ArrayBuffer } = {
  name: undefined,
  buffer: undefined,
};

function getVoiceUrl(japaneseVoice?: JapaneseVoiceType) {
  let voice_model: URL;
  switch (japaneseVoice) {
    case "happy":
      voice_model = voice_model_happy;
      break;

    case "angry":
      voice_model = voice_model_angry;
      break;

    case "sad":
      voice_model = voice_model_sad;
      break;

    case "deep":
      voice_model = voice_model_deep;
      break;

    default:
      voice_model = voice_model_neutral;
      break;
  }

  return { url: voice_model, name: japaneseVoice ?? "default" };
}

wSelf.addEventListener("message", messageHandler);

function messageHandler(event: MessageEvent) {
  const data = event.data as JaVoiceWorkerQuery;

  const {
    uid,
    index,
    tl: language,
    q: query,
    AbortController,
    japaneseVoice,
  } = data;

  if (
    language === "ja" &&
    query !== null &&
    typeof jBuildSpeech === "function"
  ) {
    void new Promise<{ name: JapaneseVoiceType; buffer: ArrayBuffer }>(
      (resolve, reject) => {
        const { name, buffer } = voice;

        if (name !== japaneseVoice || buffer === undefined) {
          const { url: voice_url, name: voice_name } =
            getVoiceUrl(japaneseVoice);

          void fetch(voice_url)
            .then((res) => res.arrayBuffer())
            .then((voice_buffer) => {
              resolve({ name: voice_name, buffer: voice_buffer });
            });
          return;
        }
        if (buffer === undefined || name === undefined) {
          reject(`Could not fetch selected voice ${japaneseVoice}`);
          return;
        }

        resolve({ name, buffer });
      }
    ).then(({name, buffer}) => {
      voice = {name, buffer};

      const {
        uid: resUid,
        index: resIndex,
        buffer: resBuffer,
      } = jBuildSpeech(uid, index, query, new Uint8Array(buffer));

      const response: VoiceWorkerResponse = {
        uid: resUid,
        index: resIndex,
        buffer: resBuffer,
      };
      wSelf.postMessage(response);
    });
  }
}
