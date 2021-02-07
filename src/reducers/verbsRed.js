import { GET_VERBS } from "../actions/verbsAct";
import { GET_VOCABULARY } from "../actions/vocabularyAct";

const DEFAULT_STATE = { value: [] };
const DEFAULT_ACTION = {};

const verbsReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_VOCABULARY:
    case GET_VERBS:
      return {
        ...state,
        value: Object.values(action.value).filter((o) => o.grp === "verb"),
      };
    default:
      return state;
  }
};

export default verbsReducer;
