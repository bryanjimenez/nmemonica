import { GET_KANJI } from "../actions/kanjiAct";

const DEFAULT_STATE = {
  value: [],
};
const DEFAULT_ACTION = {};

const kanjiReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_KANJI:
      const value = Object.keys(action.value).map((k) => ({
        ...action.value[k],
        uid: k,
      }));

      return {
        ...state,
        value,
      };
    default:
      return state;
  }
};

export default kanjiReducer;
