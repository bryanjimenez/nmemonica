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
      return {
        ...state,
        hiragana: { choiceN: action.value },
      };
    case SET_VERB_ORDERING:
      return {
        ...state,
        verbs: { ordered: !state.verbs.ordered },
      };
    case SET_PHRASES_ORDERING:
      return {
        ...state,
        phrases: { ordered: !state.phrases.ordered },
      };
    case FLIP_PHRASES_PRACTICE_SIDE:
      return {
        ...state,
        phrases: { practiceSide: !state.phrases.practiceSide },
      };
    default:
      return state;
  }
};

export default settingsReducer;
