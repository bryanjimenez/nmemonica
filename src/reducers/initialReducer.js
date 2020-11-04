import { INITIAL_DATA } from "../actions/contacts";

const DEFAULT_STATE = {};
const DEFAULT_ACTION = {};

const initialReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case INITIAL_DATA:
      return action.payload;
    default:
      return state;
  }
};

export default initialReducer;
