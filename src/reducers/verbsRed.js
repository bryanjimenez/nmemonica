import { GET_VERBS } from "../actions/verbsAct";

const DEFAULT_STATE = [];
const DEFAULT_ACTION = {};

const verbsReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_VERBS:
      return {
        ...state,
        value: Object.keys(action.value).map((k) => {
          return {
            ...action.value[k],
            auid: k,
          };
        }),
      };
    default:
      return state;
  }
};

export default verbsReducer;
