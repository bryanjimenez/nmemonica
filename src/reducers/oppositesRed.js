import { GET_OPPOSITES } from "../hooks/oppositesHK";

const DEFAULT_STATE = { value: [] };
/** @type {{type:string, value:any}} to avoid ts-nocheck */
const DEFAULT_ACTION = {};

const oppositesReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_OPPOSITES:
      return {
        ...state,
        value: action.value,
      };
    default:
      return state;
  }
};

export default oppositesReducer;
