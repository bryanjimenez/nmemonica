import { combineReducers } from "redux";
import verbsReducer from "./verbsRed";
import phrasesReducer from "./phrasesRed";
import oppositesReducer from "./oppositesRed";
import hiraganaReducer from "./hiraganaRed";

const rootReducer = combineReducers({
  verbs: verbsReducer,
  phrases: phrasesReducer,
  opposites: oppositesReducer,
  hiragana: hiraganaReducer,
});

export default rootReducer;
