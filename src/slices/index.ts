import { configureStore } from "@reduxjs/toolkit";

import globalReducer from "./globalSlice";
import kanaReducer from "./kanaSlice";
import kanjiReducer from "./kanjiSlice";
import oppositesReducer from "./oppositeSlice";
import particleGameReducer from "./particleSlice";
import phrasesReducer from "./phraseSlice";
import serviceWorkerReducer from "./serviceWorkerSlice";
import vocabularyReducer from "./vocabularySlice";
import audioReducer from "./voiceSlice";
import type { AppProgressState, AppSettingState } from "../typings/slices";

// https://redux-toolkit.js.org/tutorials/typescript#define-root-state-and-dispatch-types
export type storeDispatch = typeof store.dispatch;
export type rootState = ReturnType<typeof store.getState>;

export const store = configureStore({
  reducer: {
    global: globalReducer,
    sw: serviceWorkerReducer,
    audio: audioReducer,

    kana: kanaReducer,
    vocabulary: vocabularyReducer,
    opposite: oppositesReducer,
    phrases: phrasesReducer,
    kanji: kanjiReducer,
    particle: particleGameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
      serializableCheck: {
        ignoredActions: ["voice/getSynthAudioWorkaroundNoAsync/fulfilled"],
      },
    }),
});

export const settingsKeys = [
  "global",
  "vocabulary",
  "phrases",
  "kanji",
  "kana",
  "opposite",
  "particle",
] as const;

/**
 * Validator for AppSettingState Object
 */
export function isValidAppSettingsState(
  settingObj: object
): settingObj is Partial<AppSettingState> {
  // TODO: require deeper checks

  return Object.keys(settingObj).every((key) =>
    // @ts-expect-error key is string settingsKeys is const
    settingsKeys.includes(key)
  );
}

/**
 * Validator for AppProgressState Object
 */
export function isValidStudyProgress(
  studyProgressObj: object
): studyProgressObj is Partial<AppProgressState> {
  // TODO: require deeper checks
  return Object.keys(studyProgressObj).every((key) =>
    ["vocabulary", "phrases", "kanji"].includes(key)
  );
}

export default store;
