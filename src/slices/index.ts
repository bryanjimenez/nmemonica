import { configureStore } from "@reduxjs/toolkit";

import globalReducer, { type GlobalInitSlice } from "./globalSlice";
import kanaReducer, { type KanaInitSlice } from "./kanaSlice";
import kanjiReducer, { type KanjiInitSlice } from "./kanjiSlice";
import oppositesReducer, { type OppositeInitSlice } from "./oppositeSlice";
import particleGameReducer, { type ParticleInitSlice } from "./particleSlice";
import phrasesReducer, { type PhraseInitSlice } from "./phraseSlice";
import serviceWorkerReducer from "./serviceWorkerSlice";
import versionsReducer from "./versionSlice";
import vocabularyReducer, { type VocabularyInitSlice } from "./vocabularySlice";

export const store = configureStore({
  reducer: {
    global: globalReducer,
    sw: serviceWorkerReducer,
    version: versionsReducer,

    kana: kanaReducer,
    vocabulary: vocabularyReducer,
    opposite: oppositesReducer,
    phrases: phrasesReducer,
    kanji: kanjiReducer,
    particle: particleGameReducer,
  },
});

// https://redux-toolkit.js.org/tutorials/typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export interface LocalStorageState {
  global: GlobalInitSlice;
  vocabulary: VocabularyInitSlice["setting"];
  phrases: PhraseInitSlice["setting"];
  kanji: KanjiInitSlice["setting"];
  kana: KanaInitSlice["setting"];

  opposite: OppositeInitSlice;
  particle: ParticleInitSlice["setting"];
}

export default store;
