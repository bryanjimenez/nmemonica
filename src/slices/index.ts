import { configureStore } from "@reduxjs/toolkit";

import globalReducer, { GlobalInitSlice } from "./globalSlice";
import kanaReducer, { KanaInitSlice } from "./kanaSlice";
import kanjiReducer, { KanjiInitSlice } from "./kanjiSlice";
import oppositesReducer, { OppositeInitSlice } from "./oppositeSlice";
import particleGameReducer, { ParticleInitSlice } from "./particleSlice";
import phrasesReducer, { PhraseInitSlice } from "./phraseSlice";
import serviceWorkerReducer from "./serviceWorkerSlice";
import versionsReducer from "./versionSlice";
import vocabularyReducer, { VocabularyInitSlice } from "./vocabularySlice";

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
