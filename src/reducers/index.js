import { configureStore } from "@reduxjs/toolkit";
import verbReducer from "../slices/verbsSlice";
import kanaReducer from "./kanaRed";
import kanjiReducer from "./kanjiRed";
import loginReducer from "./loginRed";
import oppositesReducer from "./oppositesRed";
import phrasesReducer from "./phrasesRed";
import settingsReducer from "./settingsRed";
import versionsReducer from "./versionsRed";
import vocabularyReducer from "./vocabularyRed";

export const store = configureStore({
  reducer: {
    phrases: phrasesReducer,
    vocabulary: vocabularyReducer,
    verb: verbReducer,
    opposites: oppositesReducer,
    kana: kanaReducer,
    kanji: kanjiReducer,
    settings: settingsReducer,
    login: loginReducer,
    version: versionsReducer,
  },
});
