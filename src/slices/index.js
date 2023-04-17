import { configureStore } from "@reduxjs/toolkit";
import kanaReducer from "./kanaSlice";
import kanjiReducer from "./kanjiSlice";
import oppositesReducer from "./oppositeSlice";
import phrasesReducer from "./phraseSlice";
import versionsReducer from "./versionSlice";
import vocabularyReducer from "./vocabularySlice";
import serviceWorkerReducer from "./serviceWorkerSlice";
import particleGameReducer from "./particleSlice";
import globalSlice from "./globalSlice";

export const store = configureStore({
  reducer: {
    global: globalSlice,
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
