import {
  type JapaneseVoice,
  buildSpeech as jBuildSpeech,
} from "@nmemonica/voice-ja";

import {
  type JapaneseVoiceType,
  VOICE_KIND_JA,
  type VoiceWorkerQuery,
  type VoiceWorkerResponse,
} from "../constants/voiceConstants";
import { VoiceError } from "../slices/voiceSlice";

import { exceptionToError } from ".";

const wSelf = globalThis.self as unknown as Worker;

export interface JaVoiceWorkerQuery extends VoiceWorkerQuery {
  japaneseVoice?: JapaneseVoiceType;
}

wSelf.addEventListener("message", messageHandler);

function messageHandler(event: MessageEvent) {
  const data = event.data as JaVoiceWorkerQuery;

  const { uid, index, tl: language, q: query, japaneseVoice } = data;

  if (
    language === "ja" &&
    query !== null &&
    typeof jBuildSpeech === "function"
  ) {
    let voice_model: JapaneseVoice;
    switch (japaneseVoice) {
      case "default":
      case undefined:
        voice_model = VOICE_KIND_JA.NEUTRAL;
        break;

      default:
        voice_model = japaneseVoice;
    }

    try {
      const {
        uid: resUid,
        index: resIndex,
        buffer: resBuffer,
      } = jBuildSpeech(uid, index, query, voice_model);
      const response: VoiceWorkerResponse = {
        uid: resUid,
        index: resIndex,
        buffer: resBuffer,
      };
      wSelf.postMessage(response);
    } catch (exception) {
      const error = exceptionToError(exception) as VoiceError;
      error.cause.module = "voice-worker-ja";

      wSelf.postMessage(error);
    }
  }
}
