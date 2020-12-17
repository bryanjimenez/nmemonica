import { FIREBASE_LOGOUT, GET_USER_SETTINGS } from "../actions/firebase";
import {
  FLIP_PHRASES_PRACTICE_SIDE,
  SET_HIRAGANA_BTN_N,
  SET_PHRASES_ORDERING,
  SET_VERB_ORDERING,
} from "../actions/settingsAct";

const DEFAULT_STATE = {
  hiragana: { choiceN: 16 },
  verbs: { ordered: true },
  phrases: { ordered: true, practiceSide: false },
};
const DEFAULT_ACTION = {};

const settingsReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case SET_HIRAGANA_BTN_N:
      const choiceN = action.value ? action.value : !state.hiragana.choiceN;
      return {
        ...state,
        hiragana: { ...state.hiragana, choiceN },
      };
    case SET_VERB_ORDERING:
      const ordered = action.value ? action.value : !state.verbs.ordered;
      return {
        ...state,
        verbs: { ...state.verbs, ordered },
      };
    case SET_PHRASES_ORDERING:
      const newOrder = action.value ? action.value : !state.phrases.ordered;
      return {
        ...state,
        phrases: { ...state.phrases, ordered: newOrder },
      };
    case FLIP_PHRASES_PRACTICE_SIDE:
      const practiceSide = action.value
        ? action.value
        : !state.phrases.practiceSide;
      return {
        ...state,
        phrases: { ...state.phrases, practiceSide },
      };
    case GET_USER_SETTINGS:
      return {
        ...state,
        ...action.value,
      };
    case FIREBASE_LOGOUT:
      return DEFAULT_STATE;
    default:
      return state;
  }
};

export default settingsReducer;
