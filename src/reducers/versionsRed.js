import { GET_VERSIONS } from "../actions/firebase";

const DEFAULT_STATE = {};
const DEFAULT_ACTION = {};

const versionsReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_VERSIONS:
      return {
        ...action.value,
      };
    default:
      return state;
  }
};

export default versionsReducer;
