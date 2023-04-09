import { configureStore } from "@reduxjs/toolkit";
import kanaReducer from "./kanaRed";
import kanjiReducer from "./kanjiRed";
import loginReducer from "./loginRed";
import oppositesReducer from "./oppositesRed";
import phrasesReducer from "./phrasesRed";
import settingsReducer from "./settingsRed";
import settingsReducerHK from "../slices/settingSlice";
import versionsReducer from "./versionsRed";
import vocabularyReducer from "./vocabularyRed";
import vocabularyReducerHK from "../slices/verbsSlice";

export const store = configureStore({
  reducer: {
    phrases: phrasesReducer,
    vocabulary: vocabularyReducer,
    vocabularyHK: vocabularyReducerHK, // FIXME: hooks
    opposites: oppositesReducer,
    kana: kanaReducer,
    kanji: kanjiReducer,
    settings: settingsReducer,
    settingsHK: settingsReducerHK, // FIXME: hooks
    login: loginReducer,
    version: versionsReducer,
  },
});
