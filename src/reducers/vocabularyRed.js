import { GET_VOCABULARY } from "../actions/vocabularyAct";

const DEFAULT_STATE = { value: [], groups: [] };
const DEFAULT_ACTION = {};

const vocabularyReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_VOCABULARY:
      return {
        ...state,
        groups: Object.values(action.value).reduce((a, o) => {
          if (!a.includes(o.grp)) {
            return [...a, o.grp];
          }
          return a;
        }, []),
        value: Object.keys(action.value).map((k) => ({
          ...action.value[k],
          uid: k,
        })),
      };
    default:
      return state;
  }
};

export default vocabularyReducer;
