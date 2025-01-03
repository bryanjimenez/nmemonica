import { buildSpeech as jBuildSpeech } from "@nmemonica/voice-ja";

import voice_model_deep from "../../res/models/hts_voice_nitech_jp_atr503_m001-1.05/nitech_jp_atr503_m001.htsvoice";
import voice_model_angry from "../../res/models/tohoku-f01/tohoku-f01-angry.htsvoice";
import voice_model_happy from "../../res/models/tohoku-f01/tohoku-f01-happy.htsvoice";
import voice_model_neutral from "../../res/models/tohoku-f01/tohoku-f01-neutral.htsvoice";
import voice_model_sad from "../../res/models/tohoku-f01/tohoku-f01-sad.htsvoice";
import { type JapaneseVoiceType } from "../slices/audioSlice";

const swSelf = globalThis.self as unknown as Worker;

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

swSelf.addEventListener("message", messageHandler);

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

    void fetch(voice_model)
      .then((res) => res.arrayBuffer())
      .then((model_buf) => {
        const {
          uid: resUid,
          index: resIndex,
          buffer: resBuffer,
        } = jBuildSpeech(uid, index, query, new Uint8Array(model_buf));

        const response: VoiceWorkerResponse = {
          uid: resUid,
          index: resIndex,
          buffer: resBuffer,
        };
        self.postMessage(response);
      });
  }
}
