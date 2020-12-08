import { SET_HIRAGANA_BTN_N, SET_VERB_ORDERING } from "../actions/settingsAct";

const DEFAULT_STATE = {
  hiragana: { choiceN: 16 },
  verbs: { ordered: true },
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
    default:
      return state;
  }
};

export default settingsReducer;
