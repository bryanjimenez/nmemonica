import { GET_KANJI } from "../actions/kanjiAct";
import { buildGroupObject } from "../helper/reducerHelper";

const DEFAULT_STATE = {
  value: [],
  grpObj: {},
};
/** @type {{type:string, value:any}} to avoid ts-nocheck */
const DEFAULT_ACTION = {};

const kanjiReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_KANJI: {
      const value = Object.keys(action.value).map((k) => ({
        ...action.value[k],
        uid: k,
      }));

      return {
        ...state,
        grpObj: buildGroupObject(action.value),
        value,
      };
    }
    default:
      return state;
  }
};

export default kanjiReducer;
