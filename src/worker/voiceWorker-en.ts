import { buildSpeech as eBuildSpeech } from "@nmemonica/voice-en";

import { type JapaneseVoiceType } from "../slices/audioSlice";

const swSelf = globalThis.self as unknown as Worker;

export interface VoiceWorkerQuery {
  // TODO: uid & index to prevent swapping buffers incorrectly
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
  const data = event.data as VoiceWorkerQuery;

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
      self.postMessage(response);
    } catch (err) {
      // TODO: voice-en proper err loggin
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }
}
