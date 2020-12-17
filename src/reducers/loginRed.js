import {
  FIREBASE_LOGIN,
  FIREBASE_LOGOUT,
  GET_USER_SETTINGS,
} from "../actions/firebase";

const DEFAULT_STATE = { user: undefined };
const DEFAULT_ACTION = {};

const loginReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case FIREBASE_LOGIN:
      return {
        ...state,
        user: {
          uid: action.value,
        },
      };
    case FIREBASE_LOGOUT:
      return DEFAULT_STATE;
    default:
      return state;
  }
};

export default loginReducer;
