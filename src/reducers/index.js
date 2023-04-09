import { configureStore } from "@reduxjs/toolkit";
import kanaReducer from "../slices/kanaSlice";
import kanjiReducer from "../slices/kanjiSlice";
import loginReducer from "./loginRed";
import oppositesReducer from "../slices/oppositeSlice";
import phrasesReducer from "../slices/phraseSlice";
import settingsReducer from "./settingsRed";
import settingsReducerHK from "../slices/settingSlice";
import versionsReducer from "../slices/versionSlice";
import vocabularyReducer from "../slices/vocabularySlice";
import serviceWorkerReducer from "../slices/serviceWorkerSlice";

export const store = configureStore({
  reducer: {
    login: loginReducer,            // PENDING delete
    sw: serviceWorkerReducer,
    version: versionsReducer,

    settings: settingsReducer,      // PENDING delete
    settingsHK: settingsReducerHK,  // FIXME: hooks + class

    kana: kanaReducer,
    vocabulary: vocabularyReducer,
    opposite: oppositesReducer,
    phrases: phrasesReducer,
    kanji: kanjiReducer,
  },
});
