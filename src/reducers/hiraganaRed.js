import { GET_HIRAGANA } from "../actions/hiraganaAct";

const DEFAULT_STATE = { characters: [], vowels: [], consonants: [] };
const DEFAULT_ACTION = {};

const hiraganaReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_HIRAGANA:
      return {
        ...state,
        characters: action.hiragana,
        vowels: action.vowels,
        consonants: action.consonants,
      };
    default:
      return state;
  }
};

export default hiraganaReducer;
