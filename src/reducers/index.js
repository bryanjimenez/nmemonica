import { combineReducers } from "redux";
import phrasesReducer from "./phrasesRed";
import vocabularyReducer from "./vocabularyRed";
import oppositesReducer from "./oppositesRed";
import kanaReducer from "./kanaRed";
import particlesReducer from "./particlesRed";
import settingsReducer from "./settingsRed";
import loginReducer from "./loginRed";
import versionsReducer from "./versionsRed";
import kanjiReducer from "./KanjiRed";

const rootReducer = combineReducers({
  phrases: phrasesReducer,
  vocabulary: vocabularyReducer,
  opposites: oppositesReducer,
  kana: kanaReducer,
  kanji: kanjiReducer,
  particles: particlesReducer,
  settings: settingsReducer,
  login: loginReducer,
  version: versionsReducer,
});

export default rootReducer;
