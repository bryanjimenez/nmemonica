import { combineReducers } from "redux";
import verbsReducer from "./verbsRed";
import phrasesReducer from "./phrasesRed";
import oppositesReducer from "./oppositesRed";
import hiraganaReducer from "./hiraganaRed";
import particlesReducer from "./particlesRed";
import settingsReducer from "./settingsRed";

const rootReducer = combineReducers({
  verbs: verbsReducer,
  phrases: phrasesReducer,
  opposites: oppositesReducer,
  hiragana: hiraganaReducer,
  particles: particlesReducer,
  settings: settingsReducer,
});

export default rootReducer;
