import { GET_PARTICLES } from "../actions/particlesAct";
import { shuffleArray } from "../helper/arrayHelper";

const DEFAULT_STATE = { value: [] };
const DEFAULT_ACTION = {};

const oppositesReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_PARTICLES:
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
