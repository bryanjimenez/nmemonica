import {
  GET_VOCABULARY,
  SET_PREVIOUS_SEEN_WORD,
  SET_PUSHED_PLAY,
} from "../actions/vocabularyAct";
import { SET_SHOWN_FORM } from "../actions/verbsAct";
import { buildGroupObject } from "../helper/reducerHelper";

const DEFAULT_STATE = {
  value: [],
  grpObj: {},
  previous: undefined,
  pushedPlay: false,
  verbForm: "dictionary",
};
const DEFAULT_ACTION = {};

const vocabularyReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_VOCABULARY:
      let transitivity = {};
      let value = Object.keys(action.value).map((k) => {
        if (action.value[k].trans) {
          transitivity[action.value[k].trans] = {
            intr: k,
            trans: action.value[k].trans,
          };
        }

        return {
          ...action.value[k],
          uid: k,
        };
      });

      value = value.map((v) => {
        return transitivity[v.uid]
          ? { ...v, intr: transitivity[v.uid].intr }
          : v;
      });

      return {
        ...state,
        grpObj: buildGroupObject(action.value),
        value,
      };
    case SET_SHOWN_FORM:
      return {
        ...state,
        verbForm: action.value,
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
