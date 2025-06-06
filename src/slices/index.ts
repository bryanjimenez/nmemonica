import { configureStore } from "@reduxjs/toolkit";
import type { MetaDataObj } from "nmemonica";

import globalReducer, { type GlobalInitSlice } from "./globalSlice";
import kanaReducer, { type KanaInitSlice } from "./kanaSlice";
import kanjiReducer, { type KanjiInitSlice } from "./kanjiSlice";
import oppositesReducer, { type OppositeInitSlice } from "./oppositeSlice";
import particleGameReducer, { type ParticleInitSlice } from "./particleSlice";
import phrasesReducer, { type PhraseInitSlice } from "./phraseSlice";
import serviceWorkerReducer from "./serviceWorkerSlice";
import vocabularyReducer, { type VocabularyInitSlice } from "./vocabularySlice";
import audioReducer from "./voiceSlice";

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

// https://redux-toolkit.js.org/tutorials/typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export interface AppSettingState {
  global: GlobalInitSlice;
  vocabulary: VocabularyInitSlice["setting"];
  phrases: PhraseInitSlice["setting"];
  kanji: KanjiInitSlice["setting"];
  kana: KanaInitSlice["setting"];

  opposite: OppositeInitSlice;
  particle: ParticleInitSlice["setting"];
}

export interface AppProgressState {
  vocabulary: Record<string, MetaDataObj>;
  phrases: Record<string, MetaDataObj>;
  kanji: Record<string, MetaDataObj>;
}

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
