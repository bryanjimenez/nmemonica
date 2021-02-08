import { combineReducers } from "redux";
import verbsReducer from "./verbsRed";
import phrasesReducer from "./phrasesRed";
import vocabularyReducer from "./vocabularyRed";
import oppositesReducer from "./oppositesRed";
import hiraganaReducer from "./hiraganaRed";
import particlesReducer from "./particlesRed";
import settingsReducer from "./settingsRed";
import loginReducer from "./loginRed";
import versionsReducer from "./versionsRed";

const rootReducer = combineReducers({
  verbs: verbsReducer,
  phrases: phrasesReducer,
  vocabulary: vocabularyReducer,
  opposites: oppositesReducer,
  hiragana: hiraganaReducer,
  particles: particlesReducer,
  settings: settingsReducer,
  login: loginReducer,
  version: versionsReducer,
});

export default rootReducer;
