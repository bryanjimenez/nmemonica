import { EnglishVoice, buildSpeech as eBuildSpeech } from "@nmemonica/voice-en";

import { type EnglishVoiceType } from "../slices/audioSlice";

import { exceptionToError } from ".";

const wSelf = globalThis.self as unknown as Worker;

export interface EnVoiceWorkerQuery {
  // uid & index to prevent swapping buffers incorrectly
  uid: string;
  index?: number;

  tl: string;
  q: string;
  englishVoice?: EnglishVoiceType;
  AbortController?: AbortController;
}

export interface VoiceWorkerResponse {
  uid: string;
  index?: number;

  buffer: Uint8Array;
}

wSelf.addEventListener("message", messageHandler);

function messageHandler(event: MessageEvent) {
  const data = event.data as EnVoiceWorkerQuery;

  const {
    uid,
    index,
    tl: language,
    q: query,
    AbortController,
    englishVoice,
  } = data;

  if (
    language === "en" &&
    query !== null &&
    typeof eBuildSpeech === "function"
  ) {
    let voice_model: EnglishVoice;
    switch (englishVoice) {
      case "default":
      case undefined:
        voice_model = "RobotMale";
        break;

      default:
        voice_model = englishVoice;
    }

    try {
      const {
        uid: resUid,
        index: resIndex,
        buffer: resBuffer,
      } = eBuildSpeech(uid, index, query, voice_model);
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
