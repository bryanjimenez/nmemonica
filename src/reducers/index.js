import { configureStore } from "@reduxjs/toolkit";
import kanaReducer from "./kanaRed";
import kanjiReducer from "./kanjiRed";
import loginReducer from "./loginRed";
import oppositesReducer from "./oppositesRed";
import phrasesReducer from "./phrasesRed";
import settingsReducer from "./settingsRed";
import settingsReducerHK from "../slices/settingSlice";
import versionsReducer from "../slices/versionSlice";
import vocabularyReducer from "../slices/vocabularySlice";

export const store = configureStore({
  reducer: {
    phrases: phrasesReducer,
    vocabulary: vocabularyReducer,
    opposites: oppositesReducer,
    kana: kanaReducer,
    kanji: kanjiReducer,
    settings: settingsReducer,
    settingsHK: settingsReducerHK, // FIXME: hooks + class
    login: loginReducer,
    version: versionsReducer,
  },
});
