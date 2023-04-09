import { configureStore } from "@reduxjs/toolkit";
import kanaReducer from "../slices/kanaSlice";
import kanjiReducer from "../slices/kanjiSlice";
import loginReducer from "./loginRed";
import oppositesReducer from "./oppositesRed";
import phrasesReducer from "../slices/phraseSlice";
import settingsReducer from "./settingsRed";
import settingsReducerHK from "../slices/settingSlice";
import versionsReducer from "../slices/versionSlice";
import vocabularyReducer from "../slices/vocabularySlice";
import serviceWorkerReducer from "../slices/serviceWorkerSlice";

export const store = configureStore({
  reducer: {
    login: loginReducer,
    sw: serviceWorkerReducer,
    version: versionsReducer,

    settings: settingsReducer,
    settingsHK: settingsReducerHK, // FIXME: hooks + class

    kana: kanaReducer,
    vocabulary: vocabularyReducer,
    opposites: oppositesReducer,
    phrases: phrasesReducer,
    kanji: kanjiReducer,
  },
});
