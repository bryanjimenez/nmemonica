import { configureStore } from "@reduxjs/toolkit";
import phrasesReducer from "./phrasesRed";
import vocabularyReducer from "./vocabularyRed";
import oppositesReducer from "./oppositesRed";
import kanaReducer from "./kanaRed";
import settingsReducer from "./settingsRed";
import loginReducer from "./loginRed";
import versionsReducer from "./versionsRed";
import kanjiReducer from "./kanjiRed";

export const store = configureStore({
  reducer: {
    phrases: phrasesReducer,
    vocabulary: vocabularyReducer,
    opposites: oppositesReducer,
    kana: kanaReducer,
    kanji: kanjiReducer,
    settings: settingsReducer,
    login: loginReducer,
    version: versionsReducer,
  },
});
