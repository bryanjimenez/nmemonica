import { GET_VOCABULARY } from "../actions/vocabularyAct";

const DEFAULT_STATE = { value: [], grpObj: {} };
const DEFAULT_ACTION = {};

const vocabularyReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_VOCABULARY:
      return {
        ...state,
        grpObj: Object.values(action.value).reduce((a, o) => {
          if (a[o.grp]) {
            if (!a[o.grp].includes(o.subGrp) && o.subGrp) {
              return { ...a, [o.grp]: [...a[o.grp], o.subGrp] };
            }
            return a;
          }

          if (o.subGrp) {
            return { ...a, [o.grp]: [o.subGrp] };
          }

          return { ...a, [o.grp]: [] };
        }, {}),
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
