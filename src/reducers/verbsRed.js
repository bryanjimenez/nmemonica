import { GET_VERBS } from "../actions/verbsAct";

const DEFAULT_STATE = { value: [] };
const DEFAULT_ACTION = {};

const verbsReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_VERBS:
      return {
        ...state,
        value: action.value,
      };
    default:
      return state;
  }
};

export default verbsReducer;
