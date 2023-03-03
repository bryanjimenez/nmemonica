import { GET_KANJI } from "../actions/kanjiAct";
import { buildTagObject } from "../helper/reducerHelper";

const DEFAULT_STATE = {
  value: [],
  tagObj: [],
};
/** @type {{type:string, value:any}} to avoid ts-nocheck */
const DEFAULT_ACTION = {};

const kanjiReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_KANJI: {
      const value = Object.keys(action.value).map((k) => ({
        ...action.value[k],
        uid: k,
        tag: action.value[k].tag === undefined ? [] : action.value[k].tag,
      }));

      return {
        ...state,
        tagObj: buildTagObject(action.value),
        value,
      };
    }
    default:
      return state;
  }
};

export default kanjiReducer;
