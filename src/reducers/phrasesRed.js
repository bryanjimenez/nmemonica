import { GET_PHRASES } from "../actions/phrasesAct";
import { buildGroupObject } from "../helper/reducerHelper";

const DEFAULT_STATE = { value: [], grpObj: {} };
const DEFAULT_ACTION = {};

const phrasesReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_PHRASES:
      return {
        ...state,
        grpObj: buildGroupObject(action.value),
        value: Object.keys(action.value).map((k) => ({
          ...action.value[k],
          uid: k,
        })),
      };
    default:
      return state;
  }
};

export default phrasesReducer;
