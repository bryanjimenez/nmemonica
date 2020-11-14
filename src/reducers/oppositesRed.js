import { GET_OPPOSITES } from "../actions/oppositesAct";
import { shuffleArray } from "../helper/arrayHelper";

const DEFAULT_STATE = { value: [] };
const DEFAULT_ACTION = {};

const oppositesReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_OPPOSITES:
      shuffleArray(action.value);
      return {
        ...state,
        value: action.value,
      };
    default:
      return state;
  }
};

export default oppositesReducer;
