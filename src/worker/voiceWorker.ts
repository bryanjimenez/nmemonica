import { buildSpeech } from "@nmemonica/voice-ja";

import { getParam } from "../helper/urlHelper";

const swSelf = globalThis.self as unknown as Worker;

swSelf.addEventListener("message", run);

function run(event: MessageEvent) {
  const data = event.data as {
    audioUrl: Request;
    AbortController: AbortController;
  };

  const { audioUrl, AbortController } = data;

  if (typeof synthAudio === "function") {
    const result = synthAudio(audioUrl, AbortController);
    self.postMessage(result);
  }
}

export function synthAudio(
  audioUrl: Request,
  AbortController?: AbortController
) {
  const language = getParam(audioUrl.url, "tl");
  const query = getParam(audioUrl.url, "q");

  if (language === "ja" && query !== null) {
    // TODO: voiceWorker use AbortController?
    return buildSpeech(query);
  }
  return undefined;
}
