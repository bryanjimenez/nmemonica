import { buildSpeech as eBuildSpeech } from "@nmemonica/voice-en";

import { type JapaneseVoiceType } from "../slices/audioSlice";

import { exceptionToError } from ".";

const wSelf = globalThis.self as unknown as Worker;

export interface JaVoiceWorkerQuery {
  // uid & index to prevent swapping buffers incorrectly
  uid: string;
  index?: number;

  tl: string;
  q: string;
  englishVoice?: JapaneseVoiceType;
  AbortController?: AbortController;
}

export interface VoiceWorkerResponse {
  uid: string;
  index?: number;

  buffer: Uint8Array;
}

wSelf.addEventListener("message", messageHandler);

function messageHandler(event: MessageEvent) {
  const data = event.data as JaVoiceWorkerQuery;

  const { uid, index, tl: language, q: query, AbortController } = data;

  if (
    language === "en" &&
    query !== null &&
    typeof eBuildSpeech === "function"
  ) {
    // FIXME: voice-en input causing throws
    try {
      const {
        uid: resUid,
        index: resIndex,
        buffer: resBuffer,
      } = eBuildSpeech(uid, index, query);
      const response: VoiceWorkerResponse = {
        uid: resUid,
        index: resIndex,
        buffer: resBuffer,
      };
      wSelf.postMessage(response);
    } catch (exception) {
      const error = exceptionToError(exception, "voice-worker-en");

      wSelf.postMessage(error);
    }
  }
}
