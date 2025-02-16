import { ValuesOf } from "../typings/utils";

export type AudioItemParams = {
  uid: string;
  index?: number;
  tl: "en" | "ja";
  q: string;
};

export const VoiceErrorCode = Object.freeze({
  MODULE_LOAD_ERROR: "Failed to load module",
  MAX_RETRY: "Maximum retries exceeded",
  DUPLICATE_REQUEST: "Duplicate request",
  UNREACHABLE: "Module panicked",
  BAD_INPUT: "Invalid Input",
});

export type JapaneseVoiceType = "default" | ValuesOf<typeof VOICE_KIND_JA>;
export type EnglishVoiceType = "default" | ValuesOf<typeof VOICE_KIND_EN>;
export const VOICE_KIND_JA = Object.freeze({
  HAPPY: "happy",
  ANGRY: "angry",
  SAD: "sad",
  NEUTRAL: "neutral",
  // DEEP: "deep",
});

export const VOICE_KIND_EN = Object.freeze({
  HUMAN_FEMALE: "Human Female",
  ROBOT_MALE: "Robot Male",
});

export interface VoiceWorkerQuery {
  // uid & index to prevent swapping buffers incorrectly
  uid: AudioItemParams["uid"];
  index?: AudioItemParams["index"];

  tl: AudioItemParams["tl"];
  q: AudioItemParams["q"];

  AbortController?: AbortController;
}

export interface VoiceWorkerResponse {
  uid: string;
  index?: number;

  buffer: Uint8Array;
}
