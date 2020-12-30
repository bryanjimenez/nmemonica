import { GET_PHRASES } from "../actions/phrasesAct";

const DEFAULT_STATE = { value: [] };
const DEFAULT_ACTION = {};

const phrasesReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_PHRASES:
      return {
        ...state,
        value: Object.values(action.value),
      };
    default:
      return state;
  }
};

export default phrasesReducer;
