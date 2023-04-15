import { configureStore } from "@reduxjs/toolkit";
import kanaReducer from "./kanaSlice";
import kanjiReducer from "./kanjiSlice";
import oppositesReducer from "./oppositeSlice";
import phrasesReducer from "./phraseSlice";
import settingReducer from "./settingSlice";
import versionsReducer from "./versionSlice";
import vocabularyReducer from "./vocabularySlice";
import serviceWorkerReducer from "./serviceWorkerSlice";
import particleGameReducer from "./particleSlice";

export const store = configureStore({
  reducer: {
    sw: serviceWorkerReducer,
    version: versionsReducer,

    setting: settingReducer,

    kana: kanaReducer,
    vocabulary: vocabularyReducer,
    opposite: oppositesReducer,
    phrases: phrasesReducer,
    kanji: kanjiReducer,
    particle: particleGameReducer,
  },
});
