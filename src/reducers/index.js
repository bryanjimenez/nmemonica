import { combineReducers } from "redux";
import verbsReducer from "./verbsRed";

const rootReducer = combineReducers({
  verbs: verbsReducer,
});

export default rootReducer;
