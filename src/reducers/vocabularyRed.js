import {
  GET_VOCABULARY,
  SET_PREVIOUS_SEEN_WORD,
  SET_PUSHED_PLAY,
} from "../actions/vocabularyAct";
import { buildGroupObject } from "../helper/reducerHelper";

const DEFAULT_STATE = {
  value: [],
  grpObj: {},
  previous: undefined,
  pushedPlay: false,
};
const DEFAULT_ACTION = {};

const vocabularyReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_VOCABULARY:
      return {
        ...state,
        grpObj: buildGroupObject(action.value),
        value: Object.keys(action.value).map((k) => ({
          ...action.value[k],
          uid: k,
        })),
      };
    case SET_PREVIOUS_SEEN_WORD:
      return { ...state, previous: action.value };
    case SET_PUSHED_PLAY:
      return { ...state, pushedPlay: action.value };
    default:
      return state;
  }
};

export default vocabularyReducer;
